@echo off
cls
echo ========================================
echo          NEURONGRID LAUNCHER
echo ========================================
echo.

REM Check if first run (dependencies not installed)
if not exist "NeuronGrid-Desktop\web-ui\frontend\node_modules" (
    echo First run detected - Installing dependencies...
    echo.
    
    echo [1/7] Orchestrator...
    cd NeuronGrid-Desktop\cluster-core\orchestrator
    pip install -r requirements.txt >nul 2>&1
    cd ..\..\..
    
    echo [2/7] Model Manager...
    cd NeuronGrid-Desktop\cluster-core\model-manager
    pip install -r requirements.txt >nul 2>&1
    cd ..\..\..
    
    echo [3/7] Device Service...
    cd NeuronGrid-Desktop\node-agent\device-service
    pip install -r requirements.txt >nul 2>&1
    cd ..\..\..
    
    echo [4/7] Model Runner...
    cd NeuronGrid-Desktop\node-agent\model-runner
    pip install -r requirements.txt >nul 2>&1
    cd ..\..\..
    
    echo [5/7] Backend...
    cd NeuronGrid-Desktop\web-ui\backend
    call npm install >nul 2>&1
    cd ..\..\..
    
    echo [6/7] Frontend...
    cd NeuronGrid-Desktop\web-ui\frontend
    call npm install >nul 2>&1
    cd ..\..\..
    
    echo [7/7] Building...
    cd NeuronGrid-Desktop\web-ui\frontend
    call npm run build >nul 2>&1
    cd ..\..\..
    
    echo.
    echo Dependencies installed!
    echo.
)

echo Stopping old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting services...
echo.

start /MIN "Orchestrator" cmd /c "cd NeuronGrid-Desktop\cluster-core\orchestrator && python main.py"
timeout /t 2 /nobreak >nul

start /MIN "Model-Manager" cmd /c "cd NeuronGrid-Desktop\cluster-core\model-manager && python main.py"
timeout /t 2 /nobreak >nul

start /MIN "Device-Service" cmd /c "cd NeuronGrid-Desktop\node-agent\device-service && python main.py"
timeout /t 2 /nobreak >nul

start /MIN "Model-Runner" cmd /c "cd NeuronGrid-Desktop\node-agent\model-runner && python main.py"
timeout /t 3 /nobreak >nul

start /MIN "Backend-API" cmd /c "cd NeuronGrid-Desktop\web-ui\backend && node index.js"
timeout /t 3 /nobreak >nul

echo ========================================
echo      NEURONGRID IS STARTING...
echo ========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

cd NeuronGrid-Desktop\web-ui\frontend
call npx next start

REM When frontend stops, kill everything
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
