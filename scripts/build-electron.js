const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🔨 Building NeuronGrid Desktop App...\n');

const rootDir = path.join(__dirname, '..');
const electronDir = path.join(rootDir, 'electron');
const distDir = path.join(rootDir, 'dist');

// Step 1: Build Next.js frontend for production
console.log('📦 Building Next.js frontend...');
const frontendDir = path.join(rootDir, 'web-ui', 'frontend');
try {
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('✅ Frontend built successfully\n');
} catch (e) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}

// Step 2: Install Electron dependencies
console.log('📦 Installing Electron dependencies...');
try {
  execSync('npm install', { cwd: electronDir, stdio: 'inherit' });
  console.log('✅ Electron dependencies installed\n');
} catch (e) {
  console.error('❌ Failed to install Electron dependencies');
  process.exit(1);
}

// Step 3: Build Electron app
console.log('🔨 Building Electron app...');
try {
  execSync('npm run build:win', { cwd: electronDir, stdio: 'inherit' });
  console.log('✅ Electron app built successfully\n');
} catch (e) {
  console.error('❌ Electron build failed');
  process.exit(1);
}

// Step 4: Copy installer to root dist
console.log('📋 Copying installer to dist folder...');
const electronDistDir = path.join(electronDir, 'dist');
fs.ensureDirSync(distDir);

const installerFiles = fs.readdirSync(electronDistDir).filter(f => f.endsWith('.exe'));
installerFiles.forEach(file => {
  const src = path.join(electronDistDir, file);
  const dest = path.join(distDir, file);
  fs.copySync(src, dest);
  console.log(`✅ Copied ${file} to dist/`);
});

console.log('\n🎉 Build complete! Installer available in dist/ folder');
console.log('📦 Users can now install NeuronGrid as a desktop app!');
