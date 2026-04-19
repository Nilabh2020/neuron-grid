# 🚀 NeuronGrid Release Guide

## Quick Release (Recommended)

### Step 1: Clean Build
```bash
# Run the simple build script
scripts\build-simple.bat
```

This creates: `NeuronGrid-v1.0.0.zip`

### Step 2: Upload to Website
Upload `NeuronGrid-v1.0.0.zip` to your website for download.

### Step 3: User Instructions
Users download, extract, and run `Start-Peer.bat`

---

## GitHub Release

### Step 1: Clean Up
```bash
# Remove temporary files
git clean -fdx

# Or manually delete:
# - node_modules/
# - dist/
# - *.log files
# - test files
```

### Step 2: Commit and Push
```bash
git add .
git commit -m "Release v1.0.0 - Peer Mode"
git push origin main
```

### Step 3: Create GitHub Release
1. Go to: https://github.com/YOUR-USERNAME/neuron-grid/releases
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: `NeuronGrid v1.0.0 - Peer Mode`
5. Description:
```markdown
# 🧠 NeuronGrid v1.0.0

## What's New
- ✅ Peer Mode - Every device can be master or worker
- ✅ Auto-discovery on LAN
- ✅ Mesh networking
- ✅ Chat persistence
- ✅ Multi-device support

## Download
- Windows: [NeuronGrid-v1.0.0.zip](link)
- Linux/Mac: Clone and run `node cli.js peer`

## Requirements
- Python 3.9+
- Node.js 18+
- Same local network

## Quick Start
1. Extract zip
2. Run `Start-Peer.bat`
3. Open http://localhost:3000

See [PEER-MODE.md](PEER-MODE.md) for details.
```

6. Upload `NeuronGrid-v1.0.0.zip` as release asset
7. Publish!

---

## Advanced: Create .exe Installer

### Option 1: Using Inno Setup (Windows Installer)

**Requirements:**
- Download Inno Setup: https://jrsoftware.org/isdl.php

**Steps:**
1. Install Inno Setup
2. Open `installer.iss` in Inno Setup Compiler
3. Click "Compile"
4. Output: `dist/NeuronGrid-Setup-1.0.0.exe`

**Result:**
- Professional Windows installer
- Checks for Python
- Creates Start Menu shortcuts
- Uninstaller included

### Option 2: Using pkg (Standalone .exe)

**Requirements:**
```bash
npm install -g pkg
```

**Steps:**
```bash
node scripts/build-exe.js
```

**Result:**
- Single `NeuronGrid.exe` file
- No Node.js installation required
- ~50MB file size

---

## Distribution Options

### 1. Direct Download (Simplest)
```
https://yourwebsite.com/downloads/NeuronGrid-v1.0.0.zip
```

Users extract and run `Start-Peer.bat`

### 2. Installer Download
```
https://yourwebsite.com/downloads/NeuronGrid-Setup-1.0.0.exe
```

Users run installer, creates shortcuts automatically

### 3. GitHub Releases
```
https://github.com/YOUR-USERNAME/neuron-grid/releases/latest
```

Users download from GitHub

### 4. npm Package (Future)
```bash
npm install -g @nilabh/neuron-grid
neurongrid peer
```

---

## Website Download Page Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Download NeuronGrid</title>
</head>
<body>
    <h1>🧠 Download NeuronGrid</h1>
    
    <h2>Windows</h2>
    <a href="NeuronGrid-v1.0.0.zip">
        Download NeuronGrid v1.0.0 (ZIP)
    </a>
    
    <h2>Requirements</h2>
    <ul>
        <li>Python 3.9+ (<a href="https://www.python.org/downloads/">Download</a>)</li>
        <li>Node.js 18+ (<a href="https://nodejs.org/">Download</a>)</li>
    </ul>
    
    <h2>Quick Start</h2>
    <ol>
        <li>Extract the ZIP file</li>
        <li>Run <code>Start-Peer.bat</code></li>
        <li>Open <code>http://localhost:3000</code></li>
    </ol>
    
    <h2>Documentation</h2>
    <ul>
        <li><a href="README.md">README</a></li>
        <li><a href="PEER-MODE.md">Peer Mode Guide</a></li>
    </ul>
</body>
</html>
```

---

## Version Numbering

- **v1.0.0** - Initial release with peer mode
- **v1.1.0** - Minor features (new models, UI improvements)
- **v2.0.0** - Major features (cloud sync, mobile app)

---

## Checklist Before Release

- [ ] All tests pass
- [ ] README is up to date
- [ ] PEER-MODE.md is complete
- [ ] LICENSE.txt is included
- [ ] .gitignore is configured
- [ ] Version number updated in package.json
- [ ] Build script works
- [ ] Tested on clean Windows install
- [ ] GitHub repo is public (if open source)
- [ ] Website download page ready

---

## Post-Release

1. **Announce on social media**
2. **Create demo video**
3. **Write blog post**
4. **Submit to product directories** (Product Hunt, etc.)
5. **Monitor GitHub issues**
6. **Collect user feedback**

---

**Ready to release? Run `scripts\build-simple.bat` and upload!** 🚀
