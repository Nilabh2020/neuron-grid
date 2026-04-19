@echo off
title NeuronGrid Enterprise Edition
echo 🛠️  NILABH ENTERPRISE: Initializing Private AI Cloud...

echo 🚀 [1/4] Starting Master Orchestrator...
start /b cmd /c ".\NeuronGrid.exe start"

echo ⏳ Waiting for Brain to stabilize...
timeout /t 10 /nobreak > nul

echo 🚀 [2/4] Verifying Neural Hardware...
tasklist | findstr /i "NeuronGrid.exe" > nul
if errorlevel 1 (
    echo ❌ ERROR: Master Process failed to start.
    pause
    exit
)

echo ✅ System Online. 
echo 🌍 Dashboard: http://localhost:3000
echo 🤖 Playground: http://localhost:3000/chat
echo.
echo Press any key to shutdown the cluster...
pause
taskkill /f /im NeuronGrid.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1
taskkill /f /im node.exe > nul 2>&1
