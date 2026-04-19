const { app, BrowserWindow, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let services = [];

// Detect if running from installed app or dev
const isDev = !app.isPackaged;
const rootDir = isDev ? path.join(__dirname, '..') : path.dirname(app.getPath('exe'));

function findAvailableDir(baseName) {
  const candidates = [
    path.join(rootDir, baseName),
    path.join(rootDir, '..', baseName),
    path.join(process.resourcesPath, baseName)
  ];
  
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return null;
}

function startService(name, cmd, cwd) {
  if (!fs.existsSync(cwd)) {
    console.error(`[${name}] Directory not found: ${cwd}`);
    return null;
  }
  
  console.log(`[${name}] Starting in ${cwd}...`);
  const proc = spawn(cmd, { shell: true, cwd, stdio: 'pipe' });
  
  proc.stdout.on('data', (data) => console.log(`[${name}] ${data.toString().trim()}`));
  proc.stderr.on('data', (data) => console.error(`[${name}] ${data.toString().trim()}`));
  proc.on('close', (code) => console.log(`[${name}] Exited with code ${code}`));
  
  services.push({ name, proc });
  return proc;
}

async function startBackendServices() {
  const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
  
  // Find directories
  const orchDir = findAvailableDir('cluster-core/orchestrator');
  const mmDir = findAvailableDir('cluster-core/model-manager');
  const devDir = findAvailableDir('node-agent/device-service');
  const runDir = findAvailableDir('node-agent/model-runner');
  const backDir = findAvailableDir('web-ui/backend');
  const frontDir = findAvailableDir('web-ui/frontend');
  
  // Start Python services
  if (orchDir) startService('Orchestrator', `${pythonCmd} main.py`, orchDir);
  if (mmDir) startService('Model-Manager', `${pythonCmd} main.py`, mmDir);
  if (devDir) startService('Device-Service', `${pythonCmd} main.py`, devDir);
  if (runDir) startService('Model-Runner', `${pythonCmd} main.py`, runDir);
  
  // Start Node backend
  if (backDir) startService('Web-Backend', 'node index.js', backDir);
  
  // Start Next.js frontend
  if (frontDir) {
    // In production, we need to build first, then start
    const nextCmd = isDev ? 'npm run dev' : 'node node_modules/next/dist/bin/next start';
    startService('Web-Frontend', nextCmd, frontDir);
  }
  
  // Wait for services to start
  await new Promise(resolve => setTimeout(resolve, 5000));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    autoHideMenuBar: true,
    title: 'NeuronGrid'
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Load the Next.js app
  mainWindow.loadURL('http://localhost:3000');

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle page load errors
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.reload();
      }
    }, 2000);
  });
}

app.whenReady().then(async () => {
  console.log('🚀 Starting NeuronGrid...');
  
  // Start all backend services
  await startBackendServices();
  
  // Create the Electron window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill all services
  services.forEach(({ name, proc }) => {
    console.log(`Stopping ${name}...`);
    proc.kill();
  });
  
  app.quit();
});

app.on('before-quit', () => {
  // Cleanup
  services.forEach(({ proc }) => {
    try {
      proc.kill();
    } catch (e) {
      // Ignore
    }
  });
});
