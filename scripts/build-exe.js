const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building NeuronGrid.exe...\n');

// Step 1: Install pkg if not already installed
console.log('[1/4] Checking pkg...');
try {
    execSync('pkg --version', { stdio: 'ignore' });
    console.log('      ✓ pkg is installed\n');
} catch {
    console.log('      Installing pkg...');
    execSync('npm install -g pkg', { stdio: 'inherit' });
    console.log('      ✓ pkg installed\n');
}

// Step 2: Update package.json for pkg
console.log('[2/4] Configuring package.json...');
const packageJson = require('../package.json');

packageJson.bin = {
    "neurongrid": "./cli.js"
};

packageJson.pkg = {
    "assets": [
        "cluster-core/**/*",
        "node-agent/**/*",
        "web-ui/**/*"
    ],
    "targets": ["node18-win-x64"],
    "outputPath": "dist"
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('      ✓ package.json configured\n');

// Step 3: Build with pkg
console.log('[3/4] Building executable...');
console.log('      This may take a few minutes...\n');

try {
    execSync('pkg . --targets node18-win-x64 --output dist/NeuronGrid.exe', { 
        stdio: 'inherit',
        maxBuffer: 10 * 1024 * 1024 
    });
    console.log('\n      ✓ Executable built\n');
} catch (error) {
    console.error('      ✗ Build failed:', error.message);
    process.exit(1);
}

// Step 4: Verify
console.log('[4/4] Verifying build...');
if (fs.existsSync('dist/NeuronGrid.exe')) {
    const stats = fs.statSync('dist/NeuronGrid.exe');
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`      ✓ NeuronGrid.exe created (${sizeMB} MB)\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ BUILD SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Executable location: dist/NeuronGrid.exe\n');
    console.log('Next steps:');
    console.log('  1. Test: dist\\NeuronGrid.exe peer');
    console.log('  2. Create installer: Use Inno Setup with installer.iss');
    console.log('  3. Distribute: Upload to your website\n');
} else {
    console.error('      ✗ Build verification failed\n');
    process.exit(1);
}
