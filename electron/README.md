# NeuronGrid Desktop App

This is the Electron wrapper that packages NeuronGrid as a native desktop application.

## Features

- ✅ Native Windows application
- ✅ Shows up in Start Menu as "NeuronGrid"
- ✅ Desktop shortcut
- ✅ Same UI, colors, fonts as web version
- ✅ Bundles all backend services
- ✅ One-click installer

## Development

```bash
# Install dependencies
cd electron
npm install

# Run in development mode
npm start
```

## Building

From the root directory:

```bash
# Build the desktop app installer
npm run build:electron
```

This will:
1. Build the Next.js frontend
2. Package everything with Electron
3. Create a Windows installer in `dist/`

## What Gets Installed

When users install NeuronGrid:
- App appears in Start Menu
- Desktop shortcut (optional)
- All Python services bundled
- Web UI bundled
- Launches as native app window

## Requirements

Users need:
- Python 3.9+ (for backend services)
- Node.js (bundled with app)

## Architecture

```
electron/
├── main.js          # Electron main process
├── preload.js       # Security preload script
├── package.json     # Electron config & build settings
└── icon.ico         # App icon
```

The app:
1. Starts all Python backend services
2. Starts Node.js backend
3. Starts Next.js frontend
4. Opens Electron window to http://localhost:3000
5. Preserves exact UI styling and fonts
