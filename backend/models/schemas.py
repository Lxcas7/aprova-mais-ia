from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

VALID_UFS = {
    "Nacional",
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


def parse_ufs_list(raw: Union[str, List[str], None]) -> List[str]:
    if raw is None:
        return ["Nacional"]
    items = raw if isinstance(raw, list) else str(raw).split(",")
    cleaned: List[str] = []
    seen = set()
    for part in items:
        token = str(part or "").strip()
        if not token:
            continue
        if token.lower() in ("nacional", "todas", "todo o brasil"):
            norm = "Nacional"
        else:
            norm = token.upper()
        if norm in VALID_UFS and norm not in seen:
            seen.add(norm)
            cleaned.append(norm)
    return cleaned or ["Nacional"]


def format_ufs_storage(raw: Union[str, List[str], None]) -> str:
    return ", ".join(parse_ufs_list(raw))


class DisciplinaPeso(BaseModel):
    nome: str
    questoes: int
    peso: str
    prioridade: str


class MaterialSchema(BaseModel):
    id: int
    concurso_id: str
    titulo: str
    categoria: str
    disciplina: str
    paginas: str
    gratuito: bool = True
    destaque: bool = False
    resumo_conteudo: str
    estudado: bool = False


class RumorWebSchema(BaseModel):
    id: int
    concurso_id: str
    orgao_sigla: str
    titulo_noticia: str
    fonte_portal: str
    data_captura: str
    estagio_maturidade: str
    confianca_ia: int
    analise_ia: str
    votos_comunidade: int


class ConcursoSchema(BaseModel):
    id: str
    sigla: str
    titulo: str
    orgao: str
    status: str  # 'aberto' | 'previsto' | 'encerrado'
    status_label: str
    banca: str
    vagas: str
    vagas_num: int
    salario: str
    salario_max: float
    escolaridade: str
    area: str
    uf: str
    prazo: str
    data_prova: str
    prob_ia: int
    prob_label: str
    resumo_ia: str
    fontes_internet: str
    ultimo_concurso_ano: str
    nota_corte_anterior: str
    salvo: bool = False
    disciplinas: List[DisciplinaPeso] = []
    materiais: List[MaterialSchema] = []


class NovoRumorInput(BaseModel):
    concurso_id: Optional[str] = "geral"
    orgao_sigla: str = Field(..., min_length=2, description="Sigla ou nome do órgão")
    titulo_noticia: str = Field(..., min_length=5, description="O que estão falando na internet")
    fonte_portal: str = Field(..., min_length=3, description="Portal, fórum ou Diário Oficial")


class ChatRequest(BaseModel):
    mensagem: str
    historico: Optional[List[dict]] = []


class MatchPerfilRequest(BaseModel):
    escolaridade: str = "Médio"
    area_interesse: str = "todas"
    horas_por_dia: float = Field(3.0, ge=0.5, le=16.0)
    dias_por_semana: int = Field(6, ge=1, le=7)
    foco_status: str = "todos"  # 'aberto', 'previsto', 'todos'


class LeadPremiumInput(BaseModel):
    nome: str = Field(..., min_length=2)
    contato: str = Field(..., min_length=5)
    carreira_foco: str = "Policial"
    recurso_favorito: str
    faixa_preco: str


class EventoTelemetriaInput(BaseModel):
    tipo_evento: str
    detalhe: Optional[str] = ""


class UsuarioRegistroInput(BaseModel):
    nome: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    senha: str = Field(..., min_length=4)
    carreira_foco: str = "Policial"
    escolaridade: str = "Superior"
    uf_interesse: Union[str, List[str]] = "Nacional"
    horas_estudo_dia: float = Field(4.0, ge=0.5, le=16.0)
    concurso_alvo_id: Optional[str] = "pf-2026"


class UsuarioLoginInput(BaseModel):
    email: str
    senha: str


class UsuarioAtualizarPerfilInput(BaseModel):
    nome: str
    carreira_foco: str
    escolaridade: str
    uf_interesse: Union[str, List[str]] = "Nacional"
    horas_estudo_dia: float = Field(4.0, ge=0.5, le=16.0)
    plano: Optional[str] = "Gratuito"
    concurso_alvo_id: Optional[str] = None


class SincronizarRascunhoInput(BaseModel):
    salvos: List[str] = []
    estudados: List[int] = []


class OnboardingInput(BaseModel):
    momento_jornada: str = "estudando_edital"
    concurso_alvo_id: str = "pf-2026"
    areas_interesse: List[str] = Field(default_factory=list)
    horas_dia: float = Field(4.0, ge=0.5, le=16.0)
    ufs_interesse: Optional[List[str]] = None
    dias_semana: List[str] = Field(default_factory=lambda: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"])
    nivel_base: Dict[str, str] = Field(default_factory=dict)
    estilo_estudo: str = "equilibrado"


class IniciarSessaoQuestoesInput(BaseModel):
    concurso_id: str = "pf-2026"
    tipo_sessao: str = "simulado_rapido"  # simulado_rapido | simulado_theo | nivelamento | topico_guia | prova_anterior | caderno_erros
    disciplina: str = "todas"
    dificuldade: str = "sorteado"  # facil | intermediario | dificil | sorteado
    quantidade: int = Field(10, ge=1, le=120)
    prova_titulo: Optional[str] = None


class ResponderQuestaoInput(BaseModel):
    questao_id: int
    resposta_usuario: str = ""
    em_branco: bool = False
    tempo_segundos: int = Field(45, ge=1, le=3600)


class ConcursoAlvoInput(BaseModel):
    concurso_id: str


class SuporteTheoInput(BaseModel):
    mensagem: str = Field(..., min_length=2)


class SuporteChamadoInput(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    categoria: str = "Dúvida sobre plano ou assinatura"
    mensagem: str = Field(..., min_length=5)
