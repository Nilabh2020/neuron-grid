const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // In production, we'd point to the built Next.js app
  // In dev, we point to the dev server
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../frontend/out/index.html')}`;

  win.loadURL(startUrl);
  
  // Always start with DevTools closed for the Enterprise experience
  // win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  // Start the UI backend (3001) as well
  require('./index.js');
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
