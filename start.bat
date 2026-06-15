@echo off
echo ====================================
echo    EduMatch Startup Script
echo ====================================

echo Starting Backend...
start "EduMatch Backend" cmd /k "cd backend && go run cmd/api/main.go"

echo Starting Frontend...
start "EduMatch Frontend" cmd /k "cd frontend && npm run dev"

echo Done! Two new windows should have opened.
echo You can close this window now.
