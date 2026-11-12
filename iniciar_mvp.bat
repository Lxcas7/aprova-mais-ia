@echo off
chcp 65001 >nul
title Aprova+ IA - Servidor Full-Stack MVP (FastAPI + SQLite + Frontend)
echo ============================================================================
echo   APROVA+ IA - INICIANDO MVP FULL-STACK (BACKEND FASTAPI + BANCO SQLITE)
echo ============================================================================
echo.
cd /d "%~dp0backend"
echo [1/2] Abrindo navegador em http://127.0.0.1:8000 ...
start "" "http://127.0.0.1:8000"
echo [2/2] Iniciando servidor Python Uvicorn na porta 8000...
echo       (Documentacao Swagger da API disponivel em: http://127.0.0.1:8000/docs)
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause

