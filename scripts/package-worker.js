const fs = require('fs');
const path = require('path');

console.log('📦 Packaging NeuronGrid Worker Node...\n');

const DEPLOY_DIR = 'NeuronGrid-Worker-Package';

// Clean up old deployment
if (fs.existsSync(DEPLOY_DIR)) {
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
}

// Create structure
fs.mkdirSync(DEPLOY_DIR, { recursive: true });
fs.mkdirSync(path.join(DEPLOY_DIR, 'node-agent'), { recursive: true });

console.log('✓ Created deployment directory');

// Copy node-agent files
const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Skip unnecessary files
        if (entry.name === '__pycache__' || 
            entry.name === '.env' || 
            entry.name === 'venv' ||
            entry.name === 'node_modules' ||
            entry.name.endsWith('.log')) {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

copyDir('node-agent', path.join(DEPLOY_DIR, 'node-agent'));
console.log('✓ Copied node-agent files');

// Copy CLI
fs.copyFileSync('cli.js', path.join(DEPLOY_DIR, 'cli.js'));
fs.copyFileSync('package.json', path.join(DEPLOY_DIR, 'package.json'));
console.log('✓ Copied CLI files');

// Create startup script for Windows
const startScriptWin = `@echo off
title NeuronGrid Worker Node
color 0A
echo.
echo  ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██╗
echo  ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║
echo  ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║
echo  ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║╚██╗██║
echo  ██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║
echo  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo  WORKER NODE - Distributed AI Compute
echo  ════════════════════════════════════════════════════════
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [INFO] Starting Worker Node...
echo [INFO] Auto-discovering master orchestrator on LAN...
echo.

node cli.js node

pause
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'Start-Worker.bat'), startScriptWin);
console.log('✓ Created Windows startup script');

// Create startup script for Linux/Mac
const startScriptUnix = `#!/bin/bash

echo ""
echo "  ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██╗"
echo "  ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║"
echo "  ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║"
echo "  ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║╚██╗██║"
echo "  ██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║"
echo "  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝"
echo ""
echo "  WORKER NODE - Distributed AI Compute"
echo "  ════════════════════════════════════════════════════════"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found. Please install Python 3.9+"
    exit 1
fi

echo "[INFO] Starting Worker Node..."
echo "[INFO] Auto-discovering master orchestrator on LAN..."
echo ""

node cli.js node
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'start-worker.sh'), startScriptUnix);
fs.chmodSync(path.join(DEPLOY_DIR, 'start-worker.sh'), '755');
console.log('✓ Created Unix startup script');

// Create README
const readme = `# NeuronGrid Worker Node

## 🚀 Quick Start

### Windows
1. Double-click \`Start-Worker.bat\`

### Linux/Mac
1. Run \`./start-worker.sh\`

## 📋 Requirements

- **Python 3.9+** - [Download here](https://www.python.org/downloads/)
- **Node.js** (optional, bundled in CLI)
- Same local network as the master node

## 🔧 What This Does

This worker node:
- ✅ Reports your hardware specs (CPU, RAM, GPU) to the cluster
- ✅ Receives AI inference jobs from the master orchestrator
- ✅ Helps distribute AI workload across multiple machines
- ✅ Auto-discovers the master node via LAN broadcast (UDP port 8888)

## 🔒 Privacy & Security

- All data stays on your local network
- No internet connection required
- No telemetry or external reporting
- Fully private AI inference

## 📡 Ports Used

- **8001** - Device Service (hardware monitoring)
- **8003** - Model Runner (AI inference)
- **8888** - UDP broadcast (auto-discovery)

## 🛠️ Troubleshooting

**Worker not connecting?**
- Make sure you're on the same network as the master node
- Check firewall settings (allow ports 8001, 8003, 8888)
- Verify Python is installed: \`python --version\`

**Need to change ports?**
- Edit \`.env\` files in \`node-agent/device-service/\` and \`node-agent/model-runner/\`

## 📞 Support

Contact the cluster administrator for assistance.

---

**NeuronGrid** - Your Hardware. Your Data. Your AI Cloud.
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'README.md'), readme);
console.log('✓ Created README');

// Create .env examples
const deviceEnv = `# Device Service Configuration
NODE_AGENT_PORT=8001
ORCHESTRATOR_URL=
`;

const runnerEnv = `# Model Runner Configuration
MODEL_RUNNER_PORT=8003
MODELS_DIR=
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'node-agent', 'device-service', '.env.example'), deviceEnv);
fs.writeFileSync(path.join(DEPLOY_DIR, 'node-agent', 'model-runner', '.env.example'), runnerEnv);
console.log('✓ Created environment templates');

console.log('\n✅ Worker package created successfully!\n');
console.log('📦 Package location: ' + path.resolve(DEPLOY_DIR));
console.log('\n📤 Next steps:');
console.log('   1. Copy the entire folder to the worker machine');
console.log('   2. Run the startup script');
console.log('   3. Worker will auto-discover the master node\n');
