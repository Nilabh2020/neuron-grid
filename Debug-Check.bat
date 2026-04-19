@echo off
cls
echo ========================================
echo   NeuronGrid Debug Check
echo ========================================
echo.

echo Checking if settings page exists...
if exist "NeuronGrid-Desktop\web-ui\frontend\src\app\settings\page.tsx" (
    echo [OK] Settings page source exists
) else (
    echo [ERROR] Settings page missing!
)

echo.
echo Checking if frontend is built...
if exist "NeuronGrid-Desktop\web-ui\frontend\.next" (
    echo [OK] Frontend build exists
) else (
    echo [ERROR] Frontend not built!
)

echo.
echo Checking chat storage...
set CHAT_DIR=%USERPROFILE%\.neurongrid\chats
if exist "%CHAT_DIR%" (
    echo [OK] Chat directory exists: %CHAT_DIR%
    echo.
    echo Saved chats:
    dir /b "%CHAT_DIR%\*.json" 2>nul
    if errorlevel 1 echo   No chats saved yet
) else (
    echo [ERROR] Chat directory missing!
)

echo.
echo Checking model storage...
set MODEL_DIR=%USERPROFILE%\.neurongrid\models
if exist "%MODEL_DIR%" (
    echo [OK] Model directory exists: %MODEL_DIR%
    echo.
    echo Downloaded models:
    dir /b "%MODEL_DIR%\*.gguf" 2>nul
    if errorlevel 1 echo   No models downloaded yet
) else (
    echo [ERROR] Model directory missing!
)

echo.
echo ========================================
echo   Debug Info Complete
echo ========================================
echo.
pause
