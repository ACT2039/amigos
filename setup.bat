@echo off
REM Windows setup script for Amigos development environment

echo.
echo ======================================
echo Amigos Development Setup - Windows
echo ======================================
echo.

REM Check Node.js installation
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 16+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Install root dependencies
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install frontend dependencies
    echo.
    pause
    exit /b 1
)
echo Done!
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install backend dependencies
    echo.
    pause
    exit /b 1
)
cd ..
echo Done!
echo.

REM Check for .env file
if not exist .env (
    echo Environment configuration (.env) not found.
    echo Creating from .env.example...
    copy .env.example .env
    echo Please edit .env with your configuration!
    echo.
) else (
    echo .env file exists
    echo.
)

echo.
echo ======================================
echo Setup complete!
echo ======================================
echo.
echo Next steps:
echo 1. Edit .env file with your settings
echo 2. Open two terminals and run:
echo    Terminal 1: npm run backend:dev
echo    Terminal 2: npm run dev
echo 3. Open http://localhost:5173 in browser
echo.
echo For deployment, see DEPLOYMENT.md
echo.
pause
