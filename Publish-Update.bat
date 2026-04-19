@echo off
cls
echo ========================================
echo   NeuronGrid - Publish Update to npm
echo ========================================
echo.

REM Build the frontend first
echo [1/4] Building Next.js frontend...
cd NeuronGrid-Desktop\web-ui\frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

echo.
echo [2/4] Committing changes to git...
git add .
git commit -m "Update for npm publish" 2>nul
if errorlevel 1 (
    echo No changes to commit or git not initialized
)

echo.
echo [3/4] Bumping version...
call npm version patch --no-git-tag-version

echo.
echo [4/4] Publishing to npm...
call npm publish

if errorlevel 1 (
    echo.
    echo ERROR: Publish failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PUBLISHED SUCCESSFULLY!
echo ========================================
echo.
echo Users can now update with:
echo   npm update -g neurongrid
echo.
pause
