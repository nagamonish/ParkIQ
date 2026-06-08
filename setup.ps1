# ParkIQ — one-time setup. Run once from PowerShell:  .\setup.ps1
# Creates a Windows Python venv, installs the backend (incl. the CV stack),
# and installs npm deps for all three web apps.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$venv = Join-Path $root ".venv-win"
$py = Join-Path $venv "Scripts\python.exe"

Write-Host "== ParkIQ setup ==" -ForegroundColor Cyan

# --- Python venv -----------------------------------------------------------
if (-not (Test-Path $py)) {
  Write-Host "Creating Python venv at .venv-win ..." -ForegroundColor Yellow
  # The CV stack (PyTorch/OpenCV/NumPy) needs Python 3.10-3.13 (no 3.14 wheels).
  $chosen = $null
  if (Get-Command py -ErrorAction SilentlyContinue) {
    foreach ($v in @("3.11", "3.12", "3.13", "3.10")) {
      & py "-$v" --version *> $null
      if ($LASTEXITCODE -eq 0) { $chosen = $v; break }
    }
  }
  if ($chosen) {
    Write-Host "Using Python $chosen" -ForegroundColor DarkGray
    & py "-$chosen" -m venv $venv
  } else {
    Write-Host "No compatible Python (3.10-3.13) found." -ForegroundColor Red
    Write-Host "Install one, e.g.:  py install 3.11   then re-run .\setup.ps1" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "venv already exists, reusing it." -ForegroundColor DarkGray
}

if (-not (Test-Path $py)) {
  Write-Host "venv creation failed (no python.exe at $py). Check the errors above." -ForegroundColor Red
  exit 1
}

Write-Host "Upgrading pip ..." -ForegroundColor Yellow
& $py -m pip install --upgrade pip

Write-Host "Installing backend dependencies (this pulls PyTorch - large, be patient) ..." -ForegroundColor Yellow
& $py -m pip install -r (Join-Path $root "backend\requirements.txt")

# --- Frontends -------------------------------------------------------------
foreach ($app in @("frontend", "sightline", "marketing")) {
  Write-Host "npm install -> $app ..." -ForegroundColor Yellow
  Push-Location (Join-Path $root $app)
  npm install
  Pop-Location
}

Write-Host ""
Write-Host "Setup complete. Start everything with:  .\run-all.ps1" -ForegroundColor Green
