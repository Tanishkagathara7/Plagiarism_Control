@echo off
echo ========================================
echo   Plagiarism Control - Unified Server
echo ========================================
echo.

echo Step 1: Building React frontend...
cd frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)

echo ✅ Frontend built successfully!
echo.

echo Step 2: Starting unified server...
cd ..\backend
python unified_backend.py

pause