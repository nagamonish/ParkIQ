# ParkIQ — launch the whole platform. Run from PowerShell:  .\run-all.ps1
# Opens one window per service. Close a window to stop that service.
#
#   Cloud API .......... http://localhost:8001   (public data + simulator)
#   Operator API ....... http://localhost:8000   (live detection)
#   Operator console ... http://localhost:5173
#   Sightline finder ... http://localhost:5174
#   Marketing site ..... http://localhost:5175

$root = $PSScriptRoot
$venv = Join-Path $root ".venv-win"
$py = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $py)) {
  Write-Host "No venv found. Run  .\setup.ps1  first." -ForegroundColor Red
  exit 1
}

# Free up our ports if a previous run left something behind (prevents stale
# duplicate servers, which can serve 500s).
foreach ($port in 8000, 8001, 5173, 5174, 5175) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Start-Service($title, $command) {
  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "`$host.UI.RawUI.WindowTitle = '$title'; $command"
  ) | Out-Null
  Write-Host "  started: $title" -ForegroundColor Green
}

Write-Host "== Launching ParkIQ ==" -ForegroundColor Cyan

# 1) Cloud API (public aggregation + demo simulator)
Start-Service "ParkIQ Cloud :8001" "cd '$root'; & '$py' -m uvicorn backend.cloud.main:app --port 8001"

# 2) Operator API (detection) — also publishes its lot up to the local cloud,
#    so a camera you connect here shows up in the public finder.
$opEnv = @(
  "`$env:CLOUD_INGEST_URL='http://localhost:8001/api/ingest'",
  "`$env:SIGHTLINE_SITE_ID='operator-demo'",
  "`$env:SITE_NAME='ParkIQ Demo Lot'",
  "`$env:SITE_TYPE='lot'",
  "`$env:SITE_CITY='San Francisco'",
  "`$env:SITE_LAT='37.7793'",
  "`$env:SITE_LNG='-122.4192'"
) -join "; "
Start-Service "ParkIQ Operator API :8000" "cd '$root'; $opEnv; & '$py' -m uvicorn backend.api.main:app --port 8000"

# Give the backends a moment before the frontends try to reach them.
Start-Sleep -Seconds 3

# 3) Operator console
Start-Service "Operator Console :5173" "cd '$root\frontend'; npm run dev"
# 4) Sightline finder
Start-Service "Sightline Finder :5174" "cd '$root\sightline'; npm run dev"
# 5) Marketing site
Start-Service "Marketing Site :5175" "cd '$root\marketing'; npm run dev"

Start-Sleep -Seconds 5
Write-Host ""
Write-Host "Opening the ParkIQ site. Navigate from there to the finder or operator console." -ForegroundColor Cyan
Start-Process "http://localhost:5175"   # marketing — the front door for everything

Write-Host ""
Write-Host "All five services are running. From the marketing site:" -ForegroundColor Green
Write-Host "  - 'Find parking' goes to the public finder (:5174)" -ForegroundColor Green
Write-Host "  - 'Operators' / 'Log in' goes to the operator console (:5173)" -ForegroundColor Green
Write-Host "Tip: in the Operator console, Cameras -> Connect camera, RTSP URL" -ForegroundColor DarkGray
Write-Host "     E:/ParkIQ/sample-data/parking-lot.mp4  to test detection with no hardware." -ForegroundColor DarkGray
