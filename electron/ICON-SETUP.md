# Setting Up App Icons

For the best user experience, you need proper icons for the NeuronGrid desktop app.

## Required Files

Place these in the `electron/` folder:

1. **icon.ico** - Windows icon (256x256 or multi-size)
2. **icon.png** - PNG fallback (512x512 recommended)

## Quick Icon Creation

### Option 1: Use an Online Converter

1. Create a 512x512 PNG logo for NeuronGrid
2. Go to https://convertio.co/png-ico/
3. Upload your PNG
4. Download as `icon.ico`
5. Place both files in `electron/` folder

### Option 2: Use ImageMagick (if installed)

```bash
# Convert PNG to ICO
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Option 3: Use GIMP (Free)

1. Open your logo in GIMP
2. Scale to 256x256: Image → Scale Image
3. Export as `icon.ico`: File → Export As → icon.ico
4. Check all size options in export dialog

## Temporary Placeholder

If you don't have an icon yet, the app will use Electron's default icon. The app will still work perfectly, just without a custom icon.

## Icon Design Tips

- Use a simple, recognizable symbol
- High contrast for visibility
- Works well at small sizes (16x16)
- Represents "AI" or "Neural Network" theme
- Square aspect ratio

## Example Icon Ideas for NeuronGrid

- Neural network nodes connected
- Brain with circuit patterns
- Grid of connected dots
- Abstract "N" with tech elements
- Cube/grid representing distributed computing

## Testing Your Icon

After adding icons:

```bash
# Rebuild the app
npm run build:electron

# Check the installer - icon should appear in:
# - Installer window
# - Start Menu
# - Desktop shortcut
# - Taskbar when running
```
