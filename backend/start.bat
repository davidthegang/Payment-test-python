@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "VENV_PYTHON=venv\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    echo.
    echo ERROR: Virtual environment not found!
    echo.
    echo Please set it up first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo Using Python from venv: %VENV_PYTHON%
echo Starting backend on http://localhost:5000 ...
echo.

"%VENV_PYTHON%" app.py
