-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
--  LOCALITIES
-- ─────────────────────────────────────────
CREATE TABLE localities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  center        GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 2000,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             VARCHAR(15) UNIQUE NOT NULL,
  name              VARCHAR(100),
  avatar_url        TEXT,
  bio               TEXT,
  location          GEOGRAPHY(POINT, 4326),
  locality_id       UUID REFERENCES localities(id) ON DELETE SET NULL,
  home_address      TEXT,
  radius_meters     INTEGER NOT NULL DEFAULT 2000,
  trust_score       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_exchanges   INTEGER NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sms_opt_in        BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  CATEGORIES
-- ─────────────────────────────────────────
CREATE TYPE category_status AS ENUM ('pending_vote', 'active', 'rejected');

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  locality_id     UUID REFERENCES localities(id) ON DELETE CASCADE,
  status          category_status NOT NULL DEFAULT 'active',
  is_global       BOOLEAN NOT NULL DEFAULT FALSE,
  vote_yes        INTEGER NOT NULL DEFAULT 0,
  vote_no         INTEGER NOT NULL DEFAULT 0,
  vote_threshold  INTEGER NOT NULL DEFAULT 50,
  vote_started_at TIMESTAMPTZ,
  vote_ends_at    TIMESTAMPTZ,
  activated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default global categories
INSERT INTO categories (name, slug, is_global, status) VALUES
  ('Blood',           'blood',           TRUE, 'active'),
  ('Medicine',        'medicine',        TRUE, 'active'),
  ('Food',            'food',            TRUE, 'active'),
  ('Tools',           'tools',           TRUE, 'active'),
  ('Furniture',       'furniture',       TRUE, 'active'),
  ('Electronics',     'electronics',     TRUE, 'active'),
  ('Books',           'books',           TRUE, 'active'),
  ('Clothes',         'clothes',         TRUE, 'active'),
  ('Transport',       'transport',       TRUE, 'active'),
  ('Home Services',   'home-services',   TRUE, 'active'),
  ('Tutoring',        'tutoring',        TRUE, 'active'),
  ('Pet Care',        'pet-care',        TRUE, 'active'),
  ('Emergency',       'emergency',       TRUE, 'active'),
  ('Other',           'other',           TRUE, 'active');

-- ─────────────────────────────────────────
--  POSTS
-- ─────────────────────────────────────────
CREATE TYPE post_mode AS ENUM ('need', 'offer', 'sell', 'volunteer', 'alert', 'request');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE post_status AS ENUM ('active', 'fulfilled', 'expired', 'removed');

CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode            post_mode NOT NULL,
  title           VARCHAR(150) NOT NULL,
  description     TEXT NOT NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  urgency         urgency_level NOT NULL DEFAULT 'low',
  status          post_status NOT NULL DEFAULT 'active',
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  locality_id     UUID REFERENCES localities(id) ON DELETE SET NULL,
  address_hint    VARCHAR(200),
  photos          TEXT[] DEFAULT '{}',
  price           DECIMAL(10,2),
  expires_at      TIMESTAMPTZ,
  fulfilled_at    TIMESTAMPTZ,
  view_count      INTEGER NOT NULL DEFAULT 0,
  sms_sent        BOOLEAN NOT NULL DEFAULT FALSE,
  sms_sent_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  CONVERSATIONS + MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID REFERENCES posts(id) ON DELETE SET NULL,
  participant_one UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, participant_one, participant_two)
);

CREATE TYPE message_type AS ENUM ('text', 'image', 'system');

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            message_type NOT NULL DEFAULT 'text',
  content         TEXT NOT NULL,
  image_url       TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  CATEGORY VOTES + SEARCH LOGS
-- ─────────────────────────────────────────
CREATE TABLE category_votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote        BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, user_id)
);

CREATE TABLE search_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  locality_id UUID REFERENCES localities(id) ON DELETE SET NULL,
  query       VARCHAR(100) NOT NULL,
  had_results BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  RATINGS
-- ─────────────────────────────────────────
CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  score           INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  tags            TEXT[] DEFAULT '{}',
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, conversation_id)
);

-- ─────────────────────────────────────────
--  REPORTS
-- ─────────────────────────────────────────
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'action_taken');
CREATE TYPE report_target AS ENUM ('post', 'user', 'message');

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id   UUID NOT NULL,
  reason      VARCHAR(200) NOT NULL,
  details     TEXT,
  status      report_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TYPE notif_type AS ENUM (
  'new_nearby_post', 'chat_message', 'post_response',
  'urgency_alert', 'category_vote', 'category_live',
  'rating_received', 'post_fulfilled'
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notif_type NOT NULL,
  title       VARCHAR(150) NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  FCM TOKENS
-- ─────────────────────────────────────────
CREATE TABLE fcm_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   VARCHAR(10) NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ─────────────────────────────────────────
--  OTP STORE  (temporary, cleaned by cron)
-- ─────────────────────────────────────────
CREATE TABLE otp_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      VARCHAR(15) NOT NULL,
  code       VARCHAR(6) NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

