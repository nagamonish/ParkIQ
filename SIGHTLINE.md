# Sightline — public parking availability

Sightline is the **public-facing** half of the ParkIQ platform. Where the
ParkIQ dashboard (`frontend/`, `backend/api`) is built for **operators** who run
the cameras, Sightline is built for **drivers** who just want to know:

> *Is there parking where I'm going — right now?*

It aggregates the **parking-detection availability** from every ParkIQ site into
a single cloud and lets anyone search across all of them.

```
   ParkIQ site A ─┐
   ParkIQ site B ─┤  (aggregate counts only:               ┌─ Sightline website
   ParkIQ site C ─┼─►  available / occupied / total)  ───► │   (search, map, live)
   ...           ─┘        via POST /api/ingest            └─ public REST + WS API
                                  │
                          Sightline Cloud
                       (in-memory hot index +
                        optional Postgres history)
```

**Privacy by design:** only summed counts leave an operator deployment — never
video frames, never per-vehicle data. See `backend/services/cloud_publisher.py`.

---

## Pieces

| Path | What it is |
| --- | --- |
| `backend/cloud/` | The Sightline **cloud** FastAPI service: public search API, `/api/ingest`, live WebSocket, demo seed + simulator. |
| `backend/services/cloud_publisher.py` | Runs inside each **operator** backend; pushes that site's aggregate availability to the cloud. |
| `sightline/` | The **public website** (React + Vite) — a separate app from `frontend/`. |
| `scripts/cloud_schema.sql` | Optional durable snapshot tables for the cloud. |
| `docker/Dockerfile.cloud`, `docker/Dockerfile.sightline`, `docker/nginx-sightline.conf` | Deployment for the public stack. |

---

## Run it locally

### 1. Cloud API (port 8001)

```bash
# from repo root
pip install -r backend/cloud/requirements.txt   # or use your existing venv
uvicorn backend.cloud.main:app --reload --port 8001
```

On boot it seeds ~14 demo locations across San Francisco and starts a live
simulator so the site is populated immediately. Disable with
`CLOUD_DISABLE_SIMULATOR=1`.

### 2. Public website (port 5174)

```bash
cd sightline
npm install
npm run dev
```

Vite proxies `/api` and `/ws` to `http://localhost:8001`, so it works
same-origin with no CORS setup. Open <http://localhost:5174>.

### 3. (Optional) Feed real ParkIQ data into the cloud

Point an operator backend at the cloud by setting, before launching it:

```bash
export CLOUD_INGEST_URL=http://localhost:8001/api/ingest
export SIGHTLINE_SITE_ID=union-square-garage
export SITE_NAME="Union Square Garage"   # self-registers a new location
export SITE_TYPE=garage SITE_CITY="San Francisco" SITE_LAT=37.788 SITE_LNG=-122.4074
# export SIGHTLINE_API_KEY=...   # if the cloud sets CLOUD_INGEST_TOKEN
```

The operator publishes its summed availability every `CLOUD_PUBLISH_INTERVAL`
seconds (default 15).

---

## Run the whole platform with Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

| URL | Service |
| --- | --- |
| <http://localhost:8080> | **Sightline public site** |
| <http://localhost> | ParkIQ operator dashboard |
| <http://localhost:8001/health> | Cloud API health |
| <http://localhost:8000/health> | Operator API health |

---

## Public API (read-only)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/locations` | Search/filter/sort. Query: `q, lat, lng, radius_km, type[], amenity[], status[], max_price, open_now, sort, limit, offset`. |
| `GET` | `/api/locations/{id}` | Full detail + history + typical week + quietest times. |
| `GET` | `/api/locations/{id}/availability` | Just the live availability. |
| `GET` | `/api/stats` | Network-wide totals (for the hero). |
| `POST` | `/api/ingest` | **Operators only** — push an aggregate snapshot. `X-API-Key` if configured. |
| `WS` | `/ws` | Initial snapshot, then `availability` deltas + periodic `stats`. |

`sort` options: `relevance` (live + emptiest + closest), `availability`,
`distance`, `price`, `occupancy`, `name`.

---

## Security & privacy notes

- **The read API is intentionally public.** `/api/locations`, `/api/stats`,
  `/api/locations/{id}`, and the `/ws` socket expose only aggregate parking
  counts and location metadata — no user data — so `allow_origins="*"` with
  `allow_credentials=false` is the correct, safe CORS posture.
- **Ingest is the only write path and should be authenticated.** Set
  `CLOUD_INGEST_TOKEN` (comma-separated keys) to require an `X-API-Key`. If it
  is unset the service logs a startup **warning**; set
  `CLOUD_REQUIRE_INGEST_AUTH=true` to refuse to start unauthenticated. Operators
  send the matching key via `SIGHTLINE_API_KEY`. Tokens are compared with
  `secrets.compare_digest` (constant time).
- **Secrets via `.env`.** Copy `.env.example` to `.env` and set real
  `DB_PASSWORD`, `CLOUD_INGEST_TOKEN`, and `SIGHTLINE_API_KEY`. `.env` is
  git-ignored. The compose defaults (`parkiq:parkiq`) are for local dev only —
  for production, inject secrets via your orchestrator (Docker/K8s secrets,
  Vault, cloud secret manager) rather than committing them.
- **Privacy by design.** Operators publish only summed `available/occupied/total`
  counts (`backend/services/cloud_publisher.py`). No video frames, license
  plates, or per-slot state ever leave a ParkIQ deployment.
- **Edge concerns left to the deployment layer.** Public-API rate limiting and
  TLS are expected at the reverse proxy / CDN, not in app code.
