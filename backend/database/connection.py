import sqlite3
from pathlib import Path
from backend.config.settings import settings


def get_db_connection() -> sqlite3.Connection:
    db_file = Path(settings.DATABASE_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_file), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_usuario_columns(cur: sqlite3.Cursor) -> None:
    cur.execute("PRAGMA table_info(usuarios)")
    existing_cols = {row["name"] for row in cur.fetchall()}
    migrations = [
        ("concurso_alvo_id", "TEXT DEFAULT 'pf-2026'"),
        ("onboarding_concluido", "INTEGER DEFAULT 0"),
        ("streak_dias", "INTEGER DEFAULT 0"),
        ("ultimo_estudo_em", "TEXT"),
    ]
    for col_name, col_def in migrations:
        if col_name not in existing_cols:
            cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col_name} {col_def}")


def init_db() -> None:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS concursos (
            id TEXT PRIMARY KEY,
            sigla TEXT NOT NULL,
            titulo TEXT NOT NULL,
            orgao TEXT NOT NULL,
            status TEXT NOT NULL,
            status_label TEXT NOT NULL,
            banca TEXT NOT NULL,
            vagas TEXT NOT NULL,
            vagas_num INTEGER NOT NULL,
            salario TEXT NOT NULL,
            salario_max REAL NOT NULL,
            escolaridade TEXT NOT NULL,
            area TEXT NOT NULL,
            uf TEXT NOT NULL,
            prazo TEXT NOT NULL,
            data_prova TEXT NOT NULL,
            prob_ia INTEGER NOT NULL,
            prob_label TEXT NOT NULL,
            resumo_ia TEXT NOT NULL,
            fontes_internet TEXT NOT NULL,
            ultimo_concurso_ano TEXT NOT NULL,
            nota_corte_anterior TEXT NOT NULL,
            salvo INTEGER DEFAULT 0,
            disciplinas_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS materiais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concurso_id TEXT NOT NULL,
            titulo TEXT NOT NULL,
            categoria TEXT NOT NULL,
            disciplina TEXT NOT NULL,
            paginas TEXT NOT NULL,
            gratuito INTEGER DEFAULT 1,
            destaque INTEGER DEFAULT 0,
            resumo_conteudo TEXT NOT NULL,
            estudado INTEGER DEFAULT 0,
            FOREIGN KEY (concurso_id) REFERENCES concursos(id)
        );

        CREATE TABLE IF NOT EXISTS rumores_web (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concurso_id TEXT NOT NULL,
            orgao_sigla TEXT NOT NULL,
            titulo_noticia TEXT NOT NULL,
            fonte_portal TEXT NOT NULL,
            data_captura TEXT NOT NULL,
            estagio_maturidade TEXT NOT NULL,
            confianca_ia INTEGER NOT NULL,
            analise_ia TEXT NOT NULL,
            votos_comunidade INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS leads_premium (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            contato TEXT NOT NULL,
            carreira_foco TEXT NOT NULL,
            recurso_favorito TEXT NOT NULL,
            faixa_preco TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS metricas_mvp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_evento TEXT NOT NULL,
            detalhe TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            carreira_foco TEXT DEFAULT 'Policial',
            escolaridade TEXT DEFAULT 'Superior',
            uf_interesse TEXT DEFAULT 'Nacional',
            horas_estudo_dia REAL DEFAULT 4.0,
            plano TEXT DEFAULT 'Gratuito',
            concurso_alvo_id TEXT DEFAULT 'pf-2026',
            onboarding_concluido INTEGER DEFAULT 0,
            streak_dias INTEGER DEFAULT 0,
            ultimo_estudo_em TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS schema_flags (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS usuario_concursos_salvos (
            user_id INTEGER NOT NULL,
            concurso_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, concurso_id),
            FOREIGN KEY (user_id) REFERENCES usuarios(id),
            FOREIGN KEY (concurso_id) REFERENCES concursos(id)
        );

        CREATE TABLE IF NOT EXISTS usuario_materiais_estudados (
            user_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, material_id),
            FOREIGN KEY (user_id) REFERENCES usuarios(id),
            FOREIGN KEY (material_id) REFERENCES materiais(id)
        );

        CREATE TABLE IF NOT EXISTS usuario_onboarding (
            user_id INTEGER PRIMARY KEY,
            momento_jornada TEXT DEFAULT 'estudando_edital',
            concurso_alvo_id TEXT DEFAULT 'pf-2026',
            areas_interesse_json TEXT DEFAULT '[]',
            horas_dia REAL DEFAULT 4.0,
            dias_semana_json TEXT DEFAULT '["Seg","Ter","Qua","Qui","Sex","Sáb"]',
            nivel_base_json TEXT DEFAULT '{}',
            estilo_estudo TEXT DEFAULT 'equilibrado',
            concluido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS questoes_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE,
            banca TEXT NOT NULL,
            orgao TEXT DEFAULT '',
            concurso_id TEXT NOT NULL,
            ano INTEGER DEFAULT 2024,
            disciplina TEXT NOT NULL,
            assunto TEXT DEFAULT '',
            dificuldade TEXT NOT NULL DEFAULT 'intermediario',
            tipo_questao TEXT NOT NULL DEFAULT 'certo_errado',
            enunciado TEXT NOT NULL,
            alternativas_json TEXT DEFAULT '[]',
            gabarito TEXT NOT NULL,
            comentario TEXT DEFAULT '',
            is_prova_anterior INTEGER DEFAULT 0,
            prova_titulo TEXT DEFAULT '',
            cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessoes_estudo_questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            concurso_id TEXT NOT NULL,
            tipo_sessao TEXT NOT NULL,
            titulo TEXT DEFAULT '',
            dificuldade_filtro TEXT DEFAULT 'sorteado',
            disciplina_filtro TEXT DEFAULT 'todas',
            questoes_ids_json TEXT NOT NULL DEFAULT '[]',
            total_questoes INTEGER NOT NULL DEFAULT 0,
            respondidas INTEGER NOT NULL DEFAULT 0,
            acertos INTEGER NOT NULL DEFAULT 0,
            erros INTEGER NOT NULL DEFAULT 0,
            branco INTEGER NOT NULL DEFAULT 0,
            escore_liquido REAL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'em_andamento',
            iniciado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finalizado_em TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS usuario_respostas_questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sessao_id INTEGER NOT NULL,
            user_id INTEGER,
            questao_id INTEGER NOT NULL,
            concurso_id TEXT NOT NULL,
            disciplina TEXT NOT NULL,
            banca TEXT NOT NULL,
            dificuldade TEXT NOT NULL,
            resposta_usuario TEXT DEFAULT '',
            correta INTEGER NOT NULL DEFAULT 0,
            em_branco INTEGER NOT NULL DEFAULT 0,
            tempo_segundos INTEGER DEFAULT 45,
            respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sessao_id) REFERENCES sessoes_estudo_questoes(id),
            FOREIGN KEY (questao_id) REFERENCES questoes_cache(id)
        );

        CREATE TABLE IF NOT EXISTS usuario_cronograma_blocos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            concurso_id TEXT NOT NULL,
            semana_ref TEXT NOT NULL,
            dia_semana TEXT NOT NULL,
            ordem INTEGER DEFAULT 1,
            disciplina TEXT NOT NULL,
            tipo_bloco TEXT NOT NULL,
            minutos_planejados INTEGER NOT NULL DEFAULT 90,
            minutos_realizados INTEGER NOT NULL DEFAULT 0,
            concluido INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS suporte_chamados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            plano TEXT DEFAULT 'Gratuito',
            concurso_alvo_id TEXT DEFAULT 'pf-2026',
            categoria TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            status TEXT DEFAULT 'aberto',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    _ensure_usuario_columns(cur)

    conn.commit()
    conn.close()
