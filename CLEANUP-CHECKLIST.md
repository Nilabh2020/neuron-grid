# 🧹 Cleanup Checklist Before GitHub Push

## Files to DELETE (Not needed for release):

```bash
# Temporary installer files
serve-installer.js
install-worker-local.ps1
Start-Installer-Server.bat
Start-Server-Simple.bat
deploy-worker.bat

# Deployment guides (replaced by PEER-MODE.md)
DEPLOYMENT-GUIDE.md
INSTALL-REMOTE.md
QUICK-INSTALL.txt

# Test files
test-server.ps1
test_cluster.bat

# Worker package (not needed in peer mode)
NeuronGrid-Worker-Package/
worker-package.zip

# Build outputs
dist/
build/

# Logs
*.log
llama_server.log

# Node modules
node_modules/
web-ui/frontend/node_modules/
web-ui/backend/node_modules/

# Python cache
__pycache__/
*.pyc
venv/
env/

# IDE files
.vscode/
.idea/
```

## Files to KEEP:

```
✅ cli.js
✅ package.json
✅ README.md
✅ PEER-MODE.md
✅ LICENSE.txt
✅ .gitignore
✅ Start-Peer.bat
✅ Start_NeuronGrid.bat
✅ cluster-core/
✅ node-agent/
✅ web-ui/
✅ scripts/
✅ Formula/ (Homebrew)
✅ Scoop/ (Scoop installer)
✅ RELEASE.md
✅ GEMINI.md
```

## Quick Cleanup Commands:

### Windows PowerShell:
```powershell
# Delete temporary files
Remove-Item -Recurse -Force NeuronGrid-Worker-Package -ErrorAction SilentlyContinue
Remove-Item worker-package.zip -ErrorAction SilentlyContinue
Remove-Item serve-installer.js -ErrorAction SilentlyContinue
Remove-Item install-worker-local.ps1 -ErrorAction SilentlyContinue
Remove-Item Start-Installer-Server.bat -ErrorAction SilentlyContinue
Remove-Item Start-Server-Simple.bat -ErrorAction SilentlyContinue
Remove-Item test-server.ps1 -ErrorAction SilentlyContinue
Remove-Item test_cluster.bat -ErrorAction SilentlyContinue
Remove-Item DEPLOYMENT-GUIDE.md -ErrorAction SilentlyContinue
Remove-Item INSTALL-REMOTE.md -ErrorAction SilentlyContinue
Remove-Item QUICK-INSTALL.txt -ErrorAction SilentlyContinue
Remove-Item deploy-worker.bat -ErrorAction SilentlyContinue
Remove-Item *.log -ErrorAction SilentlyContinue

# Delete node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web-ui\frontend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web-ui\backend\node_modules -ErrorAction SilentlyContinue

# Delete Python cache
Get-ChildItem -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force
Get-ChildItem -Recurse -Filter *.pyc | Remove-Item -Force

echo "✅ Cleanup complete!"
```

### Linux/Mac:
```bash
# Delete temporary files
rm -rf NeuronGrid-Worker-Package worker-package.zip
rm -f serve-installer.js install-worker-local.ps1
rm -f Start-Installer-Server.bat Start-Server-Simple.bat
rm -f test-server.ps1 test_cluster.bat
rm -f DEPLOYMENT-GUIDE.md INSTALL-REMOTE.md QUICK-INSTALL.txt
rm -f deploy-worker.bat
rm -f *.log

# Delete node_modules
rm -rf node_modules web-ui/frontend/node_modules web-ui/backend/node_modules

# Delete Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

echo "✅ Cleanup complete!"
```

## After Cleanup:

1. **Test the build:**
   ```bash
   scripts\build-simple.bat
   ```

2. **Test the app:**
   ```bash
   Start-Peer.bat
   ```

3. **Commit to Git:**
   ```bash
   git add .
   git commit -m "Clean release v1.0.0"
   git push origin main
   ```

4. **Create GitHub Release:**
   - Go to GitHub → Releases → New Release
   - Tag: v1.0.0
   - Upload: NeuronGrid-v1.0.0.zip

5. **Upload to Website:**
   - Upload NeuronGrid-v1.0.0.zip
   - Create download page
   - Add documentation links

---

**Ready for release!** 🚀
