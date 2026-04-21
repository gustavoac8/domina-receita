@echo off
setlocal
REM DominaReceita - Deploy one-shot (wrapper Windows CMD)
REM Uso: clique duplo ou rode no terminal.
REM Pede os tokens (caso nao estejam no ambiente) e chama o PowerShell.

if "%GH_TOKEN%"=="" (
  set /p GH_TOKEN=Cole o GH_TOKEN (ghp_...):
)
if "%VERCEL_TOKEN%"=="" (
  set /p VERCEL_TOKEN=Cole o VERCEL_TOKEN (vcp_...):
)
if "%REPO_NAME%"=="" set "REPO_NAME=dominareceita"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
echo.
echo Aperte ENTER para fechar.
pause >nul
