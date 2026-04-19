@echo off
echo ========================================
echo  NeuronGrid Simple Build
echo ========================================
echo.

REM Create dist directory
if not exist "dist" mkdir dist

REM Copy NeuronGrid.exe (pre-built or placeholder)
if exist "NeuronGrid.exe" (
    echo [1/3] Copying NeuronGrid.exe...
    copy NeuronGrid.exe dist\NeuronGrid.exe
) else (
    echo [1/3] NeuronGrid.exe not found, creating launcher...
    (
        echo @echo off
        echo cd /d "%%~dp0"
        echo node cli.js peer
        echo pause
    ) > dist\NeuronGrid.bat
    echo       Created NeuronGrid.bat instead
)

echo.
echo [2/3] Copying project files...
xcopy /E /I /Y cluster-core dist\cluster-core
xcopy /E /I /Y node-agent dist\node-agent
xcopy /E /I /Y web-ui dist\web-ui
copy cli.js dist\
copy package.json dist\
copy README.md dist\
copy PEER-MODE.md dist\
copy Start-Peer.bat dist\
copy Start_NeuronGrid.bat dist\

echo.
echo [3/3] Creating release archive...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'NeuronGrid-v1.0.0.zip' -Force"

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo.
echo Release package: NeuronGrid-v1.0.0.zip
echo.
echo Users can:
echo   1. Extract the zip
echo   2. Run Start-Peer.bat
echo   3. Open http://localhost:3000
echo.
pause
