@echo off
title Customer Onboarding Frontend Application
cd /d "%~dp0frontend"
echo Starting Frontend Dev Server...
npm run dev -- --host
pause
