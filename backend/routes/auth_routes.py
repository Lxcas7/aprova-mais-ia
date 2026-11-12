import hashlib
import secrets
from fastapi import APIRouter, HTTPException
from backend.database.connection import get_db_connection
from backend.models.schemas import (
    UsuarioRegistroInput,
    UsuarioLoginInput,
    UsuarioAtualizarPerfilInput,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticação e Usuário"])


def _hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()


def _iniciais(nome: str) -> str:
    partes = [p for p in nome.strip().split() if p]
    if not partes:
        return "U"
    if len(partes) == 1:
        return partes[0][:2].upper()
    return (partes[0][0] + partes[-1][0]).upper()


def _formatar_usuario(row) -> dict:
    return {
        "id": row["id"],
        "nome": row["nome"],
        "email": row["email"],
        "carreira_foco": row["carreira_foco"],
        "escolaridade": row["escolaridade"],
        "uf_interesse": row["uf_interesse"],
        "horas_estudo_dia": row["horas_estudo_dia"],
        "plano": row["plano"],
        "iniciais": _iniciais(row["nome"]),
        "token": f"aprovamais-jwt-{row['id']}-{secrets.token_hex(6)}"
    }


@router.post("/register")
def registrar_usuario(payload: UsuarioRegistroInput):
    conn = get_db_connection()
    cur = conn.cursor()

    email_limpo = payload.email.strip().lower()
    cur.execute("SELECT id FROM usuarios WHERE lower(email) = ?", (email_limpo,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado na plataforma.")

    cur.execute(
        """
        INSERT INTO usuarios (nome, email, senha_hash, carreira_foco, escolaridade, uf_interesse, horas_estudo_dia, plano)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Gratuito')
        """,
        (
            payload.nome.strip(),
            email_limpo,
            _hash_senha(payload.senha),
            payload.carreira_foco,
            payload.escolaridade,
            payload.uf_interesse,
            payload.horas_estudo_dia,
        ),
    )
    novo_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM usuarios WHERE id = ?", (novo_id,))
    row = cur.fetchone()
    conn.close()

    return {
        "sucesso": True,
        "mensagem": f"Bem-vindo(a) ao Aprova+ IA, {row['nome']}!",
        "usuario": _formatar_usuario(row),
    }


@router.post("/login")
def login_usuario(payload: UsuarioLoginInput):
    conn = get_db_connection()
    cur = conn.cursor()

    email_limpo = payload.email.strip().lower()
    senha_hash = _hash_senha(payload.senha)

    cur.execute(
        "SELECT * FROM usuarios WHERE lower(email) = ? AND senha_hash = ?",
        (email_limpo, senha_hash),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    return {
        "sucesso": True,
        "mensagem": f"Login realizado com sucesso! Olá, {row['nome']}.",
        "usuario": _formatar_usuario(row),
    }


@router.put("/usuarios/{user_id}")
def atualizar_perfil(user_id: int, payload: UsuarioAtualizarPerfilInput):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    cur.execute(
        """
        UPDATE usuarios
        SET nome = ?, carreira_foco = ?, escolaridade = ?, uf_interesse = ?, horas_estudo_dia = ?, plano = ?
        WHERE id = ?
        """,
        (
            payload.nome.strip(),
            payload.carreira_foco,
            payload.escolaridade,
            payload.uf_interesse,
            payload.horas_estudo_dia,
            payload.plano or "Gratuito",
            user_id,
        ),
    )
    conn.commit()

    cur.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    return {
        "sucesso": True,
        "mensagem": "Perfil e preferências de estudo atualizados com sucesso!",
        "usuario": _formatar_usuario(row),
    }
