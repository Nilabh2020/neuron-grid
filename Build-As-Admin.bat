@echo off
:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    goto :build
) else (
    echo.
    echo ========================================
    echo   ADMIN RIGHTS REQUIRED
    echo ========================================
    echo.
    echo This build requires Administrator privileges.
    echo.
    echo Please:
    echo 1. Right-click this file
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

:build
cls
echo ========================================
echo   Building NeuronGrid Installers
echo ========================================
echo.

set DESKTOP=%USERPROFILE%\Desktop
set SCRIPTDIR=%~dp0

cd /d "%SCRIPTDIR%"

echo [1/3] Building frontend...
cd NeuronGrid-Desktop\web-ui\frontend
call npm run build
cd ..\..\..

echo.
echo [2/3] Building Windows installer...
cd NeuronGrid-Desktop
call npm run build:win
cd ..

echo.
echo [3/3] Copying to Desktop...
if exist "NeuronGrid-Desktop\dist\*.exe" (
    copy "NeuronGrid-Desktop\dist\*.exe" "%DESKTOP%\"
    echo.
    echo ========================================
    echo   SUCCESS!
    echo ========================================
    echo.
    echo Installer saved to your Desktop!
    echo.
) else (
    echo ERROR: No installer found
)

pause
