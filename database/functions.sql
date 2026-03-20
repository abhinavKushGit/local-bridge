-- Returns distance in meters between two geography points
CREATE OR REPLACE FUNCTION distance_meters(
  point1 GEOGRAPHY,
  point2 GEOGRAPHY
) RETURNS FLOAT AS $$
  SELECT ST_Distance(point1, point2);
$$ LANGUAGE SQL IMMUTABLE;

-- Returns posts within radius_meters of a given lat/lng
CREATE OR REPLACE FUNCTION posts_within_radius(
  lat         FLOAT,
  lng         FLOAT,
  radius_m    INTEGER,
  mode_filter post_mode DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id           UUID,
  user_id      UUID,
  mode         post_mode,
  title        VARCHAR,
  description  TEXT,
  urgency      urgency_level,
  status       post_status,
  photos       TEXT[],
  price        DECIMAL,
  address_hint VARCHAR,
  created_at   TIMESTAMPTZ,
  distance_m   FLOAT
) AS $$
  SELECT
    p.id, p.user_id, p.mode, p.title, p.description,
    p.urgency, p.status, p.photos, p.price, p.address_hint,
    p.created_at,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY
    ) AS distance_m
  FROM posts p
  WHERE
    p.status = 'active'
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY,
      radius_m
    )
    AND (mode_filter IS NULL OR p.mode = mode_filter)
  ORDER BY distance_m ASC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$ LANGUAGE SQL;

-- Auto-update updated_at on posts and users
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Clean up expired OTPs (called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

