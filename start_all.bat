@echo off
echo Starting Customer Onboarding Details Services...
start "Backend" cmd /c "%~dp0run_backend.bat"
start "Frontend" cmd /c "%~dp0run_frontend.bat"
echo Services launched!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
