import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DB_PATH = BASE_DIR / "database" / "aprova_mais.db"
ENV_PATH = PROJECT_ROOT / ".env"


def _load_dotenv(env_file: Path) -> None:
    if not env_file.exists():
        return
    try:
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
    except OSError:
        pass


_load_dotenv(ENV_PATH)


class Settings:
    APP_NAME: str = "Aprova+ IA — Central de Orquestração e Nivelamento por Banca"
    APP_VERSION: str = "2.0.0"
    HOST: str = os.getenv("APROVA_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("APROVA_PORT", "8000"))
    DATABASE_PATH: str = os.getenv("APROVA_DATABASE_PATH", str(DB_PATH))
    FRONTEND_PATH: str = str(FRONTEND_DIR)
    CORS_ORIGINS: list[str] = ["*"]

    QUESTAPI_BASE_URL: str = os.getenv("QUESTAPI_BASE_URL", "https://api.quest.api.br/v2").rstrip("/")
    QUESTAPI_API_KEY: str = os.getenv("QUESTAPI_API_KEY", "")
    QUESTAPI_TIMEOUT_SEC: float = float(os.getenv("QUESTAPI_TIMEOUT_SEC", "10"))


settings = Settings()
