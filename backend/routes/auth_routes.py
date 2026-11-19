import hashlib
import hmac
import os
import secrets
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from backend.database.connection import get_db_connection
from backend.models.schemas import (
    UsuarioRegistroInput,
    UsuarioLoginInput,
    UsuarioAtualizarPerfilInput,
    SincronizarRascunhoInput,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticação e Usuário"])

_AUTH_SECRET = (os.getenv("APROVA_SECRET_KEY") or secrets.token_hex(32)).encode("utf-8")
_PBKDF2_ITERATIONS = 120_000


def _hash_senha(senha: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS).hex()
    return f"pbkdf2_sha256${salt}${dk}"


def _verificar_senha(senha: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2_sha256$"):
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        _, salt, expected_dk = parts
        candidate = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS).hex()
        return hmac.compare_digest(candidate, expected_dk)
    legacy_hash = hashlib.sha256(senha.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)


def gerar_token_usuario(user_id: int) -> str:
    nonce = secrets.token_hex(12)
    msg = f"{user_id}.{nonce}".encode("utf-8")
    sig = hmac.new(_AUTH_SECRET, msg, hashlib.sha256).hexdigest()
    return f"aprovamais.{user_id}.{nonce}.{sig}"


def verificar_token_usuario(token: str) -> Optional[int]:
    if not token or not token.startswith("aprovamais."):
        return None
    parts = token.split(".")
    if len(parts) != 4:
        return None
    _, uid_str, nonce, sig = parts
    if not uid_str.isdigit() or not nonce or not sig:
        return None
    expected_msg = f"{uid_str}.{nonce}".encode("utf-8")
    expected_sig = hmac.new(_AUTH_SECRET, expected_msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return None
    return int(uid_str)


def obter_usuario_autenticado(
    authorization: Optional[str] = None,
    x_user_id: Optional[int] = None,
    exigir_token: bool = False,
) -> Optional[int]:
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(status_code=401, detail="Sessão inválida. Faça login novamente.")
        token_uid = verificar_token_usuario(token.strip())
        if token_uid is None:
            raise HTTPException(status_code=401, detail="Sessão expirada ou inválida. Faça login novamente.")
        if x_user_id is not None and x_user_id != token_uid:
            raise HTTPException(status_code=403, detail="Identificador de usuário incompatível com a sessão.")
        return token_uid

    if exigir_token:
        raise HTTPException(status_code=401, detail="Faça login para realizar esta operação.")
    return x_user_id


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
        "token": gerar_token_usuario(row["id"])
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
    cur.execute("SELECT * FROM usuarios WHERE lower(email) = ?", (email_limpo,))
    row = cur.fetchone()

    if not row or not _verificar_senha(payload.senha, row["senha_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    if not row["senha_hash"].startswith("pbkdf2_sha256$"):
        cur.execute(
            "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
            (_hash_senha(payload.senha), row["id"]),
        )
        conn.commit()
    conn.close()

    return {
        "sucesso": True,
        "mensagem": f"Login realizado com sucesso! Olá, {row['nome']}.",
        "usuario": _formatar_usuario(row),
    }


@router.put("/usuarios/{user_id}")
def atualizar_perfil(
    user_id: int,
    payload: UsuarioAtualizarPerfilInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    auth_uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    if auth_uid != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar outro usuário.")

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


@router.post("/usuarios/{user_id}/sincronizar-rascunho")
def sincronizar_rascunho_visitante(
    user_id: int,
    payload: SincronizarRascunhoInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    auth_uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    if auth_uid != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para sincronizar outra conta.")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM usuarios WHERE id = ?", (user_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    salvos_sync = 0
    for cid in payload.salvos:
        cur.execute("SELECT 1 FROM concursos WHERE id = ?", (cid,))
        if cur.fetchone():
            cur.execute(
                "INSERT OR IGNORE INTO usuario_concursos_salvos (user_id, concurso_id) VALUES (?, ?)",
                (user_id, cid),
            )
            salvos_sync += cur.rowcount

    estudados_sync = 0
    for mid in payload.estudados:
        cur.execute("SELECT 1 FROM materiais WHERE id = ?", (mid,))
        if cur.fetchone():
            cur.execute(
                "INSERT OR IGNORE INTO usuario_materiais_estudados (user_id, material_id) VALUES (?, ?)",
                (user_id, mid),
            )
            estudados_sync += cur.rowcount

    conn.commit()
    conn.close()

    return {
        "sucesso": True,
        "salvos_sincronizados": salvos_sync,
        "estudados_sincronizados": estudados_sync,
    }
