from typing import List, Optional
from pydantic import BaseModel, Field


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
    horas_por_dia: int = 3
    foco_status: str = "todos"  # 'aberto', 'previsto', 'todos'


class LeadPremiumInput(BaseModel):
    nome: str = Field(..., min_length=2)
    contato: str = Field(..., min_length=5)
    carreira_foco: str = "Policial"
    recurso_favorito: str
    faixa_preco: str


class EventoTelemetriaInput(BaseModel):
    tipo_evento: str  # 'busca', 'filtro', 'material_acesso', 'radar_view', 'chat_ia', 'lead_premium'
    detalhe: Optional[str] = ""


class UsuarioRegistroInput(BaseModel):
    nome: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    senha: str = Field(..., min_length=4)
    carreira_foco: str = "Policial"
    escolaridade: str = "Superior"
    uf_interesse: str = "Nacional"
    horas_estudo_dia: int = 4


class UsuarioLoginInput(BaseModel):
    email: str
    senha: str


class UsuarioAtualizarPerfilInput(BaseModel):
    nome: str
    carreira_foco: str
    escolaridade: str
    uf_interesse: str
    horas_estudo_dia: int
    plano: Optional[str] = "Gratuito"


class SincronizarRascunhoInput(BaseModel):
    salvos: List[str] = []
    estudados: List[int] = []


