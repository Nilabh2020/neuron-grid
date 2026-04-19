const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging NeuronGrid Desktop App...\n');

const rootDir = path.join(__dirname, '..');
const electronDir = path.join(rootDir, 'electron');
const packageDir = path.join(rootDir, 'NeuronGrid-Desktop');
const desktopPath = path.join(require('os').homedir(), 'Desktop');
const outputZip = path.join(desktopPath, 'NeuronGrid-Desktop.zip');

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and create package directory
console.log('🧹 Cleaning package directory...');
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true, force: true });
}
fs.mkdirSync(packageDir, { recursive: true });

// Copy all required files
console.log('📋 Copying files...');

// Copy cluster-core
copyDir(path.join(rootDir, 'cluster-core'), path.join(packageDir, 'cluster-core'));
console.log('  ✅ cluster-core/');

// Copy node-agent
copyDir(path.join(rootDir, 'node-agent'), path.join(packageDir, 'node-agent'));
console.log('  ✅ node-agent/');

// Copy web-ui
copyDir(path.join(rootDir, 'web-ui'), path.join(packageDir, 'web-ui'));
console.log('  ✅ web-ui/');

// Copy electron files
fs.copyFileSync(path.join(electronDir, 'main.js'), path.join(packageDir, 'main.js'));
fs.copyFileSync(path.join(electronDir, 'package.json'), path.join(packageDir, 'package.json'));
fs.copyFileSync(path.join(electronDir, 'preload.js'), path.join(packageDir, 'preload.js'));
console.log('  ✅ Electron files');

// Copy README and LICENSE
if (fs.existsSync(path.join(rootDir, 'README.md'))) {
  fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(packageDir, 'README.md'));
}
if (fs.existsSync(path.join(rootDir, 'LICENSE.txt'))) {
  fs.copyFileSync(path.join(rootDir, 'LICENSE.txt'), path.join(packageDir, 'LICENSE.txt'));
}

// Create a simple launcher batch file
const launcherBat = `@echo off
echo Starting NeuronGrid...
cd /d "%~dp0"
npm start
`;
fs.writeFileSync(path.join(packageDir, 'Start-NeuronGrid.bat'), launcherBat);
console.log('  ✅ Start-NeuronGrid.bat');

// Create installation instructions
const instructions = `# NeuronGrid Desktop App

## Installation

1. Extract this folder anywhere on your PC
2. Open the folder in terminal/command prompt
3. Run: npm install
4. Run: Start-NeuronGrid.bat

## Requirements

- Node.js 18+
- Python 3.9+

## First Time Setup

\`\`\`bash
cd NeuronGrid-Desktop
npm install
\`\`\`

## Running

Double-click \`Start-NeuronGrid.bat\` or run:
\`\`\`bash
npm start
\`\`\`

The app will open in a window automatically.
`;
fs.writeFileSync(path.join(packageDir, 'INSTALL.md'), instructions);
console.log('  ✅ INSTALL.md\n');

// Create zip file
console.log('🗜️  Creating zip file...');
try {
  // Remove old zip if exists
  if (fs.existsSync(outputZip)) {
    fs.rmSync(outputZip, { force: true });
  }
  
  // Use PowerShell to create zip
  const psCommand = `Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${outputZip}" -Force`;
  execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
  
  console.log(`\n✅ Package created: ${outputZip}`);
  console.log(`📦 Size: ${(fs.statSync(outputZip).size / (1024 * 1024)).toFixed(2)} MB\n`);
  
  // Clean up temp directory
  fs.rmSync(packageDir, { recursive: true, force: true });
  
  console.log('🎉 Done! Package is on your Desktop.');
  console.log('\nTo use:');
  console.log('1. Extract NeuronGrid-Desktop.zip');
  console.log('2. Open folder in terminal');
  console.log('3. Run: npm install');
  console.log('4. Run: Start-NeuronGrid.bat');
  
} catch (e) {
  console.error('❌ Failed to create zip:', e.message);
  console.log('\n📁 Files are ready in:', packageDir);
  console.log('You can manually zip this folder.');
}
