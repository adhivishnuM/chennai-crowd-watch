@echo off
echo ===================================================
echo   Crowdex Threat Detection System - Startup Script
echo ===================================================

cd /d "%~dp0"

echo.
echo [1/3] Checking Backend Environment...
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

echo.
echo [2/3] Starting Backend Server...
start "Crowdex Backend" cmd /k "cd backend && call venv\Scripts\activate && pip install -r requirements.txt && python main.py"

echo.
echo [3/3] Starting Frontend Client...
start "Crowdex Frontend" cmd /k "npm install && npm run dev"

echo.
echo ===================================================
echo   System is starting up!
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8080/admin
echo ===================================================
echo.
pause
