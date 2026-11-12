import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DB_PATH = BASE_DIR / "database" / "aprova_mais.db"

class Settings:
    APP_NAME: str = "Aprova+ IA — API Central de Concursos Públicos (MVP)"
    APP_VERSION: str = "1.0.0-mvp"
    HOST: str = os.getenv("APROVA_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("APROVA_PORT", "8000"))
    DATABASE_PATH: str = str(DB_PATH)
    FRONTEND_PATH: str = str(FRONTEND_DIR)
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()

