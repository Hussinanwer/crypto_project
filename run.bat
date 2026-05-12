@echo off
title CryptoLab - Encryption & Decryption Tool
color 0A

echo.
echo  =====================================================
echo        CryptoLab - Cryptography Lib Lab Project
echo  =====================================================
echo.

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Python is not installed or not in PATH.
    echo  Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

:: Check pycryptodome
python -c "from Crypto.Cipher import AES" >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Installing pycryptodome...
    pip install pycryptodome
)

:: Check flask
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Installing flask...
    pip install flask
)

:: Create folders if missing
if not exist "output" mkdir output
if not exist "keys"   mkdir keys

echo  [OK] All dependencies ready.
echo.
echo  Starting web UI at http://127.0.0.1:5000
echo  Press Ctrl+C to stop the server.
echo.

:: Open browser after short delay
start "" cmd /c "timeout /t 2 >nul && start http://127.0.0.1:5000"

:: Run the app
python main.py

echo.
echo  Server stopped. Press any key to exit.
pause >nul
