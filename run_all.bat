@echo off
echo ===================================================
echo Launching OpsMind AI (Backend + Frontend)
echo ===================================================
start "OpsMind Backend" cmd /c "start_backend.bat"
timeout /t 3 /nobreak >nul
start "OpsMind Frontend" cmd /c "start_frontend.bat"
echo.
echo OpsMind AI launched!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
