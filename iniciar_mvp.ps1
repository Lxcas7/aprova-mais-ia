# Script PowerShell para inicializar o MVP Full-Stack Aprova+ IA
$ErrorActionPreference = "Continue"
$BackendDir = Join-Path $PSScriptRoot "backend"
Set-Location $BackendDir

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  APROVA+ IA — MVP FULL-STACK (FRONTEND + BACKEND FASTAPI + SQLITE)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "-> Interface Web: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "-> Swagger API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow

Start-Process "http://127.0.0.1:8000"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

