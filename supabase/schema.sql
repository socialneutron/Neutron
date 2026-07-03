-- ============================================================
-- NEUTRON SOCIAL – Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL Editor to bootstrap your DB.

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url  TEXT DEFAULT '',
  banner_url  TEXT DEFAULT '',
  bio         TEXT DEFAULT '',
  website     TEXT DEFAULT '',
  location    TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  followers_count  INT DEFAULT 0,
  following_count  INT DEFAULT 0,
  posts_count      INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ── POSTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT DEFAULT '',
  category    TEXT DEFAULT 'General',
  category_color TEXT DEFAULT '#00D2FF',
  tags        TEXT[] DEFAULT '{}',
  image_url   TEXT DEFAULT '',
  likes_count     INT DEFAULT 0,
  comments_count  INT DEFAULT 0,
  reposts_count   INT DEFAULT 0,
  bookmarks_count INT DEFAULT 0,
  is_repost   BOOLEAN DEFAULT FALSE,
  repost_of   UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author   ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created  ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- ── COMMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post   ON comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- ── LIKES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT likes_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT likes_unique_post UNIQUE (user_id, post_id),
  CONSTRAINT likes_unique_comment UNIQUE (user_id, comment_id)
);

-- ── BOOKMARKS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bookmarks_unique UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, created_at DESC);

-- ── FOLLOWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);

-- ── REPOSTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reposts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reposts_unique UNIQUE (user_id, post_id)
);

-- ── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('like','comment','follow','mention','repost')),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- ── COUNTER FUNCTIONS ───────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_count(table_name TEXT, column_name TEXT, row_id UUID)
RETURNS VOID AS $$
BEGIN
  IF table_name = 'posts' THEN
    EXECUTE format('UPDATE posts SET %I = %I + 1 WHERE id = $1', column_name, column_name) USING row_id;
  ELSIF table_name = 'users' THEN
    EXECUTE format('UPDATE users SET %I = %I + 1 WHERE id = $1', column_name, column_name) USING row_id;
  ELSIF table_name = 'comments' THEN
    EXECUTE format('UPDATE comments SET %I = %I + 1 WHERE id = $1', column_name, column_name) USING row_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_count(table_name TEXT, column_name TEXT, row_id UUID)
RETURNS VOID AS $$
BEGIN
  IF table_name = 'posts' THEN
    EXECUTE format('UPDATE posts SET %I = GREATEST(%I - 1, 0) WHERE id = $1', column_name, column_name) USING row_id;
  ELSIF table_name = 'users' THEN
    EXECUTE format('UPDATE users SET %I = GREATEST(%I - 1, 0) WHERE id = $1', column_name, column_name) USING row_id;
  ELSIF table_name = 'comments' THEN
    EXECUTE format('UPDATE comments SET %I = GREATEST(%I - 1, 0) WHERE id = $1', column_name, column_name) USING row_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── TRIGGERS ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: public read, owner write
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Posts: public read, owner write/delete
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Comments: public read, owner write/delete
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Likes: owner only
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks: owner only
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can bookmark" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, owner write/delete
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Reposts: owner only
CREATE POLICY "Reposts are viewable by everyone" ON reposts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can repost" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can undo repost" ON reposts FOR DELETE USING (auth.uid() = user_id);

-- Notifications: owner only
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);
