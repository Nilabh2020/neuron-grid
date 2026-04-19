@echo off
cls
echo ========================================
echo   Restarting NeuronGrid
echo ========================================
echo.

echo [1/3] Stopping all services...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Rebuilding frontend...
cd NeuronGrid-Desktop\web-ui\frontend
call npm run build
cd ..\..\..

echo.
echo [3/3] Starting NeuronGrid...
start "NeuronGrid" cmd /k "cd NeuronGrid-Desktop && node main.js"

echo.
echo ========================================
echo   NeuronGrid Restarted!
echo ========================================
echo.
echo Access at: http://localhost:3000
echo.
pause
