-- ── Posts Table ────────────────────────────────────────
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(300) DEFAULT '',
    body            TEXT DEFAULT '',
    image_url       TEXT DEFAULT '',
    media_url       TEXT DEFAULT '',
    media_type      VARCHAR(20) DEFAULT '' CHECK (media_type IN ('', 'image', 'video', 'audio')),
    tags            TEXT[] DEFAULT '{}',
    is_reel         BOOLEAN DEFAULT FALSE,
    location        VARCHAR(200) DEFAULT '',
    visibility      VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    likes_count     INT DEFAULT 0,
    comments_count  INT DEFAULT 0,
    reposts_count   INT DEFAULT 0,
    saves_count     INT DEFAULT 0,
    shares_count    INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    avg_watch_ratio REAL DEFAULT 0 CHECK (avg_watch_ratio >= 0 AND avg_watch_ratio <= 1),
    is_spam         BOOLEAN DEFAULT FALSE,
    is_reported     BOOLEAN DEFAULT FALSE,
    is_duplicate    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_posts_is_spam ON posts(is_spam) WHERE is_spam = FALSE;
CREATE INDEX idx_posts_explore ON posts(created_at DESC, likes_count DESC) WHERE visibility = 'public' AND is_spam = FALSE;

-- ── Updated At Trigger for posts ───────────────────────
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
