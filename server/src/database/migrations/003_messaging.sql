-- ── Conversations ───────────────────────────────────────
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title           VARCHAR(100) DEFAULT '',
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived')),
    last_message    TEXT DEFAULT '',
    last_message_id UUID,
    last_sender_id  UUID,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ── Participants ───────────────────────────────────────
CREATE TABLE participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at    TIMESTAMPTZ,
    is_admin        BOOLEAN DEFAULT FALSE,
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (conversation_id, user_id)
);

CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_conversation_id ON participants(conversation_id);

-- ── Messages ───────────────────────────────────────────
CREATE TYPE message_status AS ENUM ('sending', 'sent', 'delivered', 'seen', 'failed');

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT DEFAULT '',
    message_type    VARCHAR(30) DEFAULT 'text' CHECK (message_type IN (
                        'text', 'image', 'video', 'audio', 'file',
                        'shared_post', 'shared_reel', 'business_share',
                        'location', 'contact'
                    )),
    media_url       TEXT DEFAULT '',
    media_width     INT,
    media_height    INT,
    media_duration  INT,
    file_name       VARCHAR(255) DEFAULT '',
    file_size       BIGINT DEFAULT 0,
    mime_type       VARCHAR(100) DEFAULT '',
    reply_to        UUID REFERENCES messages(id) ON DELETE SET NULL,
    post_id         UUID,
    business_id     UUID,
    status          message_status DEFAULT 'sent',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_reply_to ON messages(reply_to);
CREATE INDEX idx_messages_status ON messages(conversation_id, status);

-- ── Message Reactions ──────────────────────────────────
CREATE TABLE message_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (message_id, user_id)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);

-- ── Read Receipts ──────────────────────────────────────
CREATE TABLE read_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, message_id)
);

CREATE INDEX idx_read_receipts_user ON read_receipts(user_id, conversation_id);

-- ── Updated At Trigger for conversations ───────────────
CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
