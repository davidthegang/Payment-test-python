<#
.SYNOPSIS
    Starts the Bakong KHQR Flask backend using the project's virtual environment.

.DESCRIPTION
    This script ensures the correct Python (from venv) is used so that all
    dependencies like python-dotenv, flask, bakong-v2 etc. are available.

.EXAMPLE
    .\start.ps1
#>

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

$venvPython = Join-Path $scriptRoot 'venv\Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
    Write-Host ""
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set it up first (from this directory):" -ForegroundColor Yellow
    Write-Host "  python -m venv venv"
    Write-Host "  .\venv\Scripts\Activate.ps1"
    Write-Host "  pip install -r requirements.txt"
    Write-Host ""
    exit 1
}

Write-Host "Using Python: $venvPython" -ForegroundColor DarkGray
Write-Host "Starting backend on http://localhost:5000 ..." -ForegroundColor Cyan
Write-Host ""

& $venvPython app.py
