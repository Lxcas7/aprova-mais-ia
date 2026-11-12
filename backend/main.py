import sys
from pathlib import Path

# Ensure parent folder (`mvp/`) is in sys.path so `backend.*` imports work regardless of cwd
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from backend.config.settings import settings
from backend.database.seed import seed_database
from backend.routes.concursos_routes import router as concursos_router
from backend.routes.materiais_routes import router as materiais_router
from backend.routes.radar_routes import router as radar_router
from backend.routes.ia_routes import router as ia_router
from backend.routes.mvp_routes import router as mvp_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API Backend do MVP Aprova+ IA: Concursos Ativos, Previstos na Internet, Histórico de Concursos Passados, Curadoria de Materiais e Smoke Test do Plano Premium."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    seed_database()


@app.get("/api/health", tags=["Status"])
def healthcheck():
    return {
        "status": "online",
        "servico": settings.APP_NAME,
        "versao": settings.APP_VERSION,
        "banco_dados": "SQLite3 Conectado (aprova_mais.db)"
    }


# Register API Routers
app.include_router(concursos_router)
app.include_router(materiais_router)
app.include_router(radar_router)
app.include_router(ia_router)
app.include_router(mvp_router)

# Serve Frontend Static Files
frontend_path = Path(settings.FRONTEND_PATH)
if frontend_path.exists():
    app.mount("/css", StaticFiles(directory=str(frontend_path / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(frontend_path / "js")), name="js")
    app.mount("/assets", StaticFiles(directory=str(frontend_path / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse(str(frontend_path / "index.html"))


if __name__ == "__main__":
    seed_database()
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=False)

