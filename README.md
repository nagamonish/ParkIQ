# ParkIQ

Camera-based parking platform with two halves:

- **ParkIQ (operator side)** — a computer-vision backend that watches a camera/RTSP feed, detects which parking slots are occupied, and an operator console to calibrate slots and monitor a lot live.
- **SightLine (public side)** — a cloud service that aggregates *aggregate availability counts* from every ParkIQ site and a public website where drivers search **a place, neighborhood, or address** and see open spaces near it in real time.

A marketing site ties the two together as the public front door.

> **Privacy by design:** operators publish only summed `available / occupied / total` counts to the cloud — never video, never per-vehicle data. See [`SIGHTLINE.md`](SIGHTLINE.md) for the public-side deep dive.

```
  Camera / RTSP ─► Operator API (detection) ─► Operator Console (calibrate, monitor)
                          │
                          │  aggregate counts only  (POST /api/ingest)
                          ▼
                   SightLine Cloud  ─►  SightLine Finder (search a place → nearby parking)
                  (in-memory index +     ▲
                   demo simulator)       └─ GET /api/geocode (place/neighborhood/address → point)
```

---

## Services & ports

| Service | URL | Entry point |
| --- | --- | --- |
| Marketing site (front door) | http://localhost:5175 | `marketing/` (Vite) |
| SightLine finder (public) | http://localhost:5174 | `sightline/` (Vite) |
| Operator console | http://localhost:5173 | `frontend/` (Vite) |
| SightLine Cloud API | http://localhost:8001 | `backend.cloud.main:app` |
| Operator API (detection) | http://localhost:8000 | `backend.api.main:app` |

Health checks: `GET http://localhost:8001/health` and `GET http://localhost:8000/health`.

---

## Prerequisites

- **Python 3.10–3.13** (the CV stack — PyTorch/OpenCV/NumPy — has no 3.14 wheels yet).
- **Node.js 18+** and npm.
- ~2 GB free disk for the Python CV dependencies; first detection run downloads the YOLO weights (~50 MB).

---

## Quick start (Windows / PowerShell)

From the repo root:

```powershell
# 1. One-time setup: creates .venv-win, installs the backend (incl. PyTorch),
#    and runs `npm install` for all three web apps.
.\setup.ps1

# 2. Launch everything (one window per service; close a window to stop it).
.\run-all.ps1
```

`run-all.ps1` frees ports 8000/8001/5173/5174/5175, starts all five services, and opens the marketing site. From there, **"Find parking"** → the public finder, **"Operators"/"Log in"** → the operator console.

**Try detection with no hardware:** in the Operator Console go to **Cameras → Connect camera** and use the bundled sample clip as the RTSP/source URL:

```
E:/ParkIQ/sample-data/parking-lot.mp4
```

---

## Manual run (any OS, without the PowerShell scripts)

### 1. Python environment

```bash
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate

# Full platform (operator detection + cloud):
pip install -r backend/requirements.txt

# …or, if you only want the SightLine cloud + finder (no CV stack, much smaller):
pip install -r backend/cloud/requirements.txt
```

### 2. Backends (run each in its own terminal, from the repo root)

```bash
# SightLine Cloud API — seeds ~14 demo SF locations and a live simulator on boot
uvicorn backend.cloud.main:app --reload --port 8001

# Operator API (detection) — needs backend/requirements.txt installed
uvicorn backend.api.main:app --reload --port 8000
```

### 3. Web apps (each in its own terminal)

```bash
cd sightline  && npm install && npm run dev   # → http://localhost:5174  (public finder)
cd frontend   && npm install && npm run dev   # → http://localhost:5173  (operator console)
cd marketing  && npm install && npm run dev   # → http://localhost:5175  (marketing)
```

The SightLine finder's Vite dev server proxies `/api` and `/ws` to the cloud on `:8001`, so it works same-origin with no CORS setup. The operator console talks to `http://localhost:8000` by default (override with `VITE_API_URL`).

### Minimal "just the search" setup

To run only the public parking search:

```bash
pip install -r backend/cloud/requirements.txt
uvicorn backend.cloud.main:app --reload --port 8001
cd sightline && npm install && npm run dev      # open http://localhost:5174
```

---

## The location search (place / neighborhood / address)

The finder's search box resolves free text to a map point and recenters distance-ranked parking around it:

1. **Offline San Francisco gazetteer** — neighborhoods and landmarks (Marina, SoMa, Nob Hill, Fisherman's Wharf, …), with aliases (FiDi → Financial District). Instant, no network.
2. **OpenStreetMap Nominatim fallback** — for arbitrary street addresses, when the gazetteer misses. Best-effort and rate-limited; degrades to literal name matching if unavailable.

Exposed as `GET /api/geocode?q=<text>` → `{ "query", "place": { label, lat, lng, source } | null }`.

Relevant cloud env vars:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SIGHTLINE_GEOCODER_NOMINATIM` | `1` | Set `0` to disable the network fallback (gazetteer only). |
| `SIGHTLINE_GEOCODER_CACHE_MAX` | `2048` | LRU cap on the geocode cache. |
| `NOMINATIM_URL` | OSM public | Override the Nominatim endpoint. |
| `NOMINATIM_USER_AGENT` | `Sightline-Parking/1.0` | Required by OSM's usage policy. |
| `NOMINATIM_TIMEOUT` | `3.0` | Per-request timeout (seconds). |

---

## Tests

```bash
# from the repo root, with the venv active
python -m pytest tests/ -q
```

`tests/test_cloud.py` and `tests/test_geocode.py` cover the cloud store, search, and the geocoder (offline — no network needed). `tests/test_detector.py` covers slot detection.

---

## Run with Docker

```bash
cp .env.example .env        # set DB_PASSWORD, CLOUD_INGEST_TOKEN, etc. for non-dev use
docker compose -f docker/docker-compose.yml up --build
```

| URL | Service |
| --- | --- |
| http://localhost:8080 | SightLine public site |
| http://localhost | Operator dashboard |
| http://localhost:8001/health | Cloud API health |
| http://localhost:8000/health | Operator API health |

---

## Configuration

Copy `.env.example` → `.env` (git-ignored) and override as needed. Highlights:

**SightLine Cloud**

| Variable | Purpose |
| --- | --- |
| `CLOUD_DISABLE_SIMULATOR` | `1` to disable the demo availability simulator. |
| `CLOUD_INGEST_TOKEN` | Comma-separated API keys required on `POST /api/ingest`. Empty = open (dev only). |
| `CLOUD_REQUIRE_INGEST_AUTH` | `true` to refuse to start if `CLOUD_INGEST_TOKEN` is empty. |
| `CLOUD_CORS_ORIGINS` | Allowed origins for the public API (default `*`). |
| `CLOUD_DATABASE_URL` | Optional Postgres URL for durable snapshot history (see `scripts/cloud_schema.sql`). |

**Operator API**

| Variable | Purpose |
| --- | --- |
| `MODEL_PATH` | YOLO weights (default `yolov8m-obb.pt`; auto-downloaded on first use). Set `none` to disable detection. |
| `CORS_ORIGINS` | Allowed origins for the operator API. |
| `CLOUD_INGEST_URL` | Cloud ingest endpoint to publish this site's availability to. |
| `SIGHTLINE_SITE_ID`, `SITE_NAME`, `SITE_TYPE`, `SITE_CITY`, `SITE_LAT`, `SITE_LNG` | This site's identity in the cloud (self-registers a location). |
| `SIGHTLINE_API_KEY` | Key sent as `X-API-Key` when the cloud requires ingest auth. |

**Web apps (build-time)**: `VITE_API_URL`, `VITE_WS_URL` (operator console), `VITE_CLOUD_URL`, `VITE_CLOUD_WS` (finder).

> **Model weights** (`*.pt`) are git-ignored. Ultralytics downloads the standard `yolov8m-obb.pt` automatically the first time the detector runs, so a fresh clone needs no manual download.

---

## Project layout

```
backend/
  api/        Operator API (FastAPI) — detection endpoints, camera management
  core/       Detector + camera manager (YOLO/OpenCV)
  services/   Calibration, DB, cloud_publisher (operator → cloud)
  cloud/      SightLine Cloud — public search API, /api/geocode, /api/ingest, WS, simulator
  models/     Pydantic schemas
frontend/     Operator console (React + Vite)
sightline/    SightLine public finder (React + Vite)
marketing/    Marketing site (React + Vite)
docker/       Dockerfiles + docker-compose + nginx configs
scripts/      DB schema, helpers
sample-data/  Sample video + images for testing detection without hardware
tests/        pytest suites
```

See [`SIGHTLINE.md`](SIGHTLINE.md) for the public-side architecture, the full read-only API reference, and security/privacy notes.
