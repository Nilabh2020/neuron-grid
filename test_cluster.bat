@echo off
echo ========================================================
echo Starting NeuronGrid Local Heterogeneous Test Cluster
echo ========================================================
echo.

start "Orchestrator" cmd /c "cd cluster-core\orchestrator && python main.py"
timeout /t 2 >nul

start "Model Manager" cmd /c "cd cluster-core\model-manager && python main.py"

echo Starting Simulated Node 1 (RTX 5060 Ti)...
start "Node 1 Agent" cmd /c "set NODE_AGENT_PORT=8001 && cd node-agent\device-service && python main.py"
start "Node 1 Runner" cmd /c "set MODEL_RUNNER_PORT=8003 && cd node-agent\model-runner && python main.py"

echo Starting Simulated Node 2 (RTX 3050 Ti)...
start "Node 2 Agent" cmd /c "set NODE_AGENT_PORT=8011 && cd node-agent\device-service && python main.py"
start "Node 2 Runner" cmd /c "set MODEL_RUNNER_PORT=8013 && cd node-agent\model-runner && python main.py"

echo Starting Web Dashboard...
start "Web Frontend" cmd /c "cd web-ui\frontend && npm run dev"
start "Web Backend" cmd /c "cd web-ui\backend && npm start"

echo.
echo Cluster is running! 
echo Check the Orchestrator console to see Asymmetric Profiling logs when chatting.
pause
