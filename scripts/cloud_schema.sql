-- Sightline cloud (public aggregation) schema.
-- The cloud serves all read traffic from an in-memory hot index; this durable
-- layer is optional and only records real site snapshots for history/audit.

CREATE TABLE IF NOT EXISTS locations (
    location_id   TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    type          TEXT NOT NULL,
    operator      TEXT NOT NULL,
    address       TEXT,
    city          TEXT,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    total_spaces  INTEGER NOT NULL DEFAULT 0,
    amenities     JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_per_hour DOUBLE PRECISION,
    currency      TEXT NOT NULL DEFAULT 'USD',
    hours         JSONB,
    description   TEXT,
    accent        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only audit log of real site snapshots. Intentionally has NO foreign
-- key to `locations`: the authoritative location registry lives in the cloud's
-- in-memory index (see backend/cloud/store.py), and the `locations` table above
-- may be empty, so a FK here would reject otherwise-valid snapshot inserts.
CREATE TABLE IF NOT EXISTS location_snapshots (
    id            BIGSERIAL PRIMARY KEY,
    location_id   TEXT NOT NULL,
    available     INTEGER NOT NULL,
    occupied      INTEGER NOT NULL,
    total         INTEGER NOT NULL,
    occupancy_pct DOUBLE PRECISION NOT NULL,
    status        TEXT NOT NULL,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_snapshots_loc_time
    ON location_snapshots(location_id, recorded_at DESC);
