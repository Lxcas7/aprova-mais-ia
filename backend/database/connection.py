import sqlite3
from pathlib import Path
from backend.config.settings import settings


def get_db_connection() -> sqlite3.Connection:
    db_file = Path(settings.DATABASE_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_file), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


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
        """
    )
    conn.commit()
    conn.close()

