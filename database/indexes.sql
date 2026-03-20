-- Geo spatial indexes (critical for radius queries)
CREATE INDEX idx_posts_location      ON posts USING GIST (location);
CREATE INDEX idx_users_location      ON users USING GIST (location);
CREATE INDEX idx_localities_center   ON localities USING GIST (center);

-- Posts lookup
CREATE INDEX idx_posts_user_id       ON posts (user_id);
CREATE INDEX idx_posts_status        ON posts (status);
CREATE INDEX idx_posts_mode          ON posts (mode);
CREATE INDEX idx_posts_urgency       ON posts (urgency);
CREATE INDEX idx_posts_locality_id   ON posts (locality_id);
CREATE INDEX idx_posts_category_id   ON posts (category_id);
CREATE INDEX idx_posts_created_at    ON posts (created_at DESC);

-- Messages lookup
CREATE INDEX idx_messages_conv_id    ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender     ON messages (sender_id);
CREATE INDEX idx_messages_unread     ON messages (conversation_id, is_read) WHERE is_read = FALSE;

-- Conversations lookup
CREATE INDEX idx_conv_participant_one ON conversations (participant_one);
CREATE INDEX idx_conv_participant_two ON conversations (participant_two);
CREATE INDEX idx_conv_post_id         ON conversations (post_id);
CREATE INDEX idx_conv_last_msg        ON conversations (last_message_at DESC);

-- Search logs for category engine
CREATE INDEX idx_search_logs_query      ON search_logs (query, locality_id, created_at DESC);
CREATE INDEX idx_search_logs_locality   ON search_logs (locality_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifs_user_unread  ON notifications (user_id, is_read, created_at DESC);

-- OTP cleanup
CREATE INDEX idx_otp_phone           ON otp_codes (phone, created_at DESC);
CREATE INDEX idx_otp_expires         ON otp_codes (expires_at);

-- Reports queue
CREATE INDEX idx_reports_status      ON reports (status, created_at DESC);

-- Users
CREATE INDEX idx_users_phone         ON users (phone);
CREATE INDEX idx_users_locality      ON users (locality_id);

