#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const command = process.argv[2];

// Detect if running inside a PKG bundle
const isBundled = process.pkg ? true : false;
const exeDir = isBundled ? path.dirname(process.execPath) : __dirname;

// Smart path: look for the folders in exeDir OR parent of exeDir
let rootDir = exeDir;
if (isBundled && !fs.existsSync(path.join(exeDir, 'cluster-core'))) {
    rootDir = path.dirname(exeDir); // Try parent if in dist/
}

function runCmd(name, cmd, cwd) {
    if (!fs.existsSync(cwd)) {
        console.error(`[${name}] ERROR: Directory not found: ${cwd}`);
        return null;
    }
    console.log(`[${name}] Starting in ${cwd}...`);
    const p = spawn(cmd, { shell: true, cwd });
    
    p.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
    p.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
    p.on('close', (code) => console.log(`[${name}] Exited with code ${code}`));
    
    return p;
}

function installPythonDeps(name, dir) {
    if (isBundled) return; // Skip in production build
    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
    console.log(`[${name}] Installing Python requirements...`);
    try {
        execSync(`${pythonCmd} -m pip install -r requirements.txt`, { stdio: 'inherit', cwd: dir });
    } catch (e) {
        console.error(`[${name}] Failed to install Python deps.`);
    }
}

function installNodeDeps(name, dir) {
    if (isBundled) return; // Skip in production build
    console.log(`[${name}] Installing Node.js dependencies...`);
    try {
        execSync(`npm install`, { stdio: 'inherit', cwd: dir });
    } catch (e) {
        console.error(`[${name}] Failed to install Node deps.`);
    }
}

if (command === 'start') {
    console.log("🚀 Starting Full NeuronGrid Cluster (Master + Worker Mode)...");
    
    const orchDir = path.join(rootDir, 'cluster-core', 'orchestrator');
    const mmDir = path.join(rootDir, 'cluster-core', 'model-manager');
    const devDir = path.join(rootDir, 'node-agent', 'device-service');
    const runDir = path.join(rootDir, 'node-agent', 'model-runner');
    const frontDir = path.join(rootDir, 'web-ui', 'frontend');
    const backDir = path.join(rootDir, 'web-ui', 'backend');

    // Install all deps
    installPythonDeps('Orchestrator', orchDir);
    installPythonDeps('Model-Manager', mmDir);
    installPythonDeps('Device-Service', devDir);
    installPythonDeps('Model-Runner', runDir);
    installNodeDeps('Web-Frontend', frontDir);
    installNodeDeps('Web-Backend', backDir);

    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';

    // Start background processes
    runCmd('Orchestrator', `${pythonCmd} main.py`, orchDir);
    runCmd('Model-Manager', `${pythonCmd} main.py`, mmDir);
    runCmd('Device-Service', `${pythonCmd} main.py`, devDir);
    runCmd('Model-Runner', `${pythonCmd} main.py`, runDir);
    
    // Give backend a moment to start before frontend/electron
    setTimeout(() => {
        runCmd('Web-Frontend', `npm run dev`, frontDir);
        runCmd('Web-Backend', `npm start`, backDir);
    }, 2000);

} else if (command === 'node') {
    console.log("🚀 Starting NeuronGrid Worker Node (Auto-discovers any Master on LAN)...");
    
    const devDir = path.join(rootDir, 'node-agent', 'device-service');
    const runDir = path.join(rootDir, 'node-agent', 'model-runner');

    installPythonDeps('Device-Service', devDir);
    installPythonDeps('Model-Runner', runDir);

    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';

    runCmd('Device-Service', `${pythonCmd} main.py`, devDir);
    runCmd('Model-Runner', `${pythonCmd} main.py`, runDir);
} else if (command === 'peer') {
    console.log("🚀 Starting NeuronGrid in Peer Mode (Master + Worker + Auto-Discovery)...");
    console.log("   This node will:");
    console.log("   • Run its own orchestrator (can be master)");
    console.log("   • Contribute compute as worker");
    console.log("   • Auto-discover other peers on LAN");
    console.log("   • Share models and workload");
    console.log("");
    
    const orchDir = path.join(rootDir, 'cluster-core', 'orchestrator');
    const mmDir = path.join(rootDir, 'cluster-core', 'model-manager');
    const devDir = path.join(rootDir, 'node-agent', 'device-service');
    const runDir = path.join(rootDir, 'node-agent', 'model-runner');
    const frontDir = path.join(rootDir, 'web-ui', 'frontend');
    const backDir = path.join(rootDir, 'web-ui', 'backend');

    // Install all deps
    installPythonDeps('Orchestrator', orchDir);
    installPythonDeps('Model-Manager', mmDir);
    installPythonDeps('Device-Service', devDir);
    installPythonDeps('Model-Runner', runDir);
    installNodeDeps('Web-Frontend', frontDir);
    installNodeDeps('Web-Backend', backDir);

    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';

    // Start all services
    runCmd('Orchestrator', `${pythonCmd} main.py`, orchDir);
    runCmd('Model-Manager', `${pythonCmd} main.py`, mmDir);
    runCmd('Device-Service', `${pythonCmd} main.py`, devDir);
    runCmd('Model-Runner', `${pythonCmd} main.py`, runDir);
    
    setTimeout(() => {
        runCmd('Web-Frontend', `npm run dev`, frontDir);
        runCmd('Web-Backend', `npm start`, backDir);
    }, 2000);
} else {
    console.log(`
🧠 NeuronGrid CLI

Usage:
  NeuronGrid start    # Master Node (Orchestrator + UI + Worker)
  NeuronGrid node     # Worker Node Only (Auto-discovers Master)
  NeuronGrid peer     # Peer Mode (Can be Master OR Worker, auto-mesh)

Peer Mode:
  • Every device runs full stack
  • Auto-discovers other peers on LAN
  • First peer becomes master, others join as workers
  • If master goes offline, another peer takes over
  • Access UI on any peer: http://localhost:3000
`);
}
