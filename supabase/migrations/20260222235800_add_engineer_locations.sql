-- Engineer Location Tracking table
-- Stores location data for engineers only during active work (travelling/in_progress)
CREATE TABLE IF NOT EXISTS engineer_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engineer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL DEFAULT 'travelling',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_engineer_locations_engineer_id ON engineer_locations(engineer_id);
CREATE INDEX IF NOT EXISTS idx_engineer_locations_recorded_at ON engineer_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_engineer_locations_engineer_recorded ON engineer_locations(engineer_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_engineer_locations_status ON engineer_locations(status);
