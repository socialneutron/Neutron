-- ── Post Tags (Content Understanding Labels) ───────────
CREATE TABLE post_tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag             VARCHAR(50) NOT NULL,
    score           REAL DEFAULT 1.0 CHECK (score >= 0 AND score <= 1),
    source          VARCHAR(20) DEFAULT 'ai' CHECK (source IN ('ai', 'manual', 'hashtag', 'audio')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag);

-- ── User Interests ─────────────────────────────────────
CREATE TABLE user_interests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    score           REAL DEFAULT 0 CHECK (score >= 0),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, category)
);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);

-- ── Explore Events (User Actions Log) ──────────────────
CREATE TYPE explore_event_type AS ENUM (
    'like', 'unlike', 'save', 'unsave', 'share',
    'watch_start', 'watch_25', 'watch_50', 'watch_75', 'watch_complete',
    'skip', 'repost', 'comment', 'view', 'click', 'dwell_3s', 'dwell_10s', 'dwell_30s'
);

CREATE TABLE explore_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    event_type      explore_event_type NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_explore_events_user ON explore_events(user_id, created_at DESC);
CREATE INDEX idx_explore_events_post ON explore_events(post_id);
CREATE INDEX idx_explore_events_type ON explore_events(event_type);
CREATE INDEX idx_explore_events_user_post ON explore_events(user_id, post_id);

-- ── Creator Quality Scores ─────────────────────────────
CREATE TABLE creator_scores (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    quality_score   REAL DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
    total_views     BIGINT DEFAULT 0,
    total_likes     BIGINT DEFAULT 0,
    total_shares    BIGINT DEFAULT 0,
    total_reports   BIGINT DEFAULT 0,
    avg_watch_ratio REAL DEFAULT 0 CHECK (avg_watch_ratio >= 0 AND avg_watch_ratio <= 1),
    post_count      INT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Similar Users (Collaborative Filtering Cache) ──────
CREATE TABLE similar_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similar_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similarity      REAL NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, similar_user_id)
);

CREATE INDEX idx_similar_users_user ON similar_users(user_id, similarity DESC);

-- ── Explore Feed Cache ─────────────────────────────────
CREATE TABLE explore_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    score           REAL NOT NULL DEFAULT 0,
    rank_position   INT NOT NULL,
    cache_key       VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, post_id, cache_key)
);

CREATE INDEX idx_explore_cache_user ON explore_cache(user_id, cache_key, rank_position);
