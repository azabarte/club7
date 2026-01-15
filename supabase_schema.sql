-- ============================================
-- Club7 - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================
-- Usuarios del club
CREATE TABLE IF NOT EXISTS club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    stickers_unlocked TEXT [] DEFAULT '{}',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Configuración del club (PIN de acceso, etc.)
CREATE TABLE IF NOT EXISTS club_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    club_pin TEXT DEFAULT '7777',
    club_name TEXT DEFAULT 'Club7',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Posts (fotos/videos)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('image', 'video')) NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    stickers TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Reacciones a posts
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id, emoji)
);
-- Mensajes del chat grupal
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('text', 'image', 'audio', 'sticker')) NOT NULL,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Misiones
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    reward_sticker TEXT,
    xp_reward INTEGER DEFAULT 50,
    active_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true
);
-- Progreso de misiones por usuario
CREATE TABLE IF NOT EXISTS mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, mission_id)
);
-- ============================================
-- Seed Data: Initial 7 Club Members
-- ============================================
INSERT INTO club_members (name, avatar_url, stickers_unlocked, xp, level)
VALUES (
        'Leo',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
        ARRAY ['🔥', '🚀'],
        700,
        5
    ),
    (
        'Sofía',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sofia',
        ARRAY ['🌸', '🦄'],
        850,
        6
    ),
    (
        'Max',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
        ARRAY ['🎮', '🍕'],
        500,
        4
    ),
    (
        'Lucía',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucia',
        ARRAY ['🎨', '⭐'],
        620,
        5
    ),
    (
        'Hugo',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Hugo',
        ARRAY ['⚽', '🏆'],
        920,
        6
    ),
    (
        'Emma',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Emma',
        ARRAY ['🎵', '🎧'],
        780,
        5
    ),
    (
        'Dani',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Dani',
        ARRAY ['🐱', '🍩'],
        430,
        3
    );
-- Initial club config
INSERT INTO club_config (id, club_pin, club_name)
VALUES (1, '7777', 'Club7') ON CONFLICT (id) DO NOTHING;
-- Sample daily missions
INSERT INTO missions (
        title,
        description,
        icon,
        reward_sticker,
        xp_reward
    )
VALUES (
        'Cazador Azul',
        'Sube una foto de algo azul',
        '🔵',
        '🐳',
        50
    ),
    (
        'Comediante',
        'Graba un video haciendo una cara graciosa',
        '🤪',
        '🎭',
        75
    ),
    (
        'Buenos Días',
        'Manda un mensaje saludando al grupo',
        '☀️',
        '🌅',
        30
    ),
    (
        'Explorador',
        'Sube cualquier foto o video hoy',
        '🧭',
        '🗺️',
        40
    ),
    (
        'Social',
        'Reacciona a 3 posts de tus amigos',
        '💬',
        '💎',
        60
    );
-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_config ENABLE ROW LEVEL SECURITY;
-- Políticas: Todos pueden leer todo (es un club privado pequeño)
CREATE POLICY "Anyone can read members" ON club_members FOR
SELECT USING (true);
CREATE POLICY "Anyone can read posts" ON posts FOR
SELECT USING (true);
CREATE POLICY "Anyone can read reactions" ON reactions FOR
SELECT USING (true);
CREATE POLICY "Anyone can read messages" ON messages FOR
SELECT USING (true);
CREATE POLICY "Anyone can read missions" ON missions FOR
SELECT USING (true);
CREATE POLICY "Anyone can read mission_progress" ON mission_progress FOR
SELECT USING (true);
CREATE POLICY "Anyone can read config" ON club_config FOR
SELECT USING (true);
-- Políticas: Insertar/actualizar
CREATE POLICY "Anyone can insert posts" ON posts FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert reactions" ON reactions FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own reactions" ON reactions FOR DELETE USING (true);
CREATE POLICY "Anyone can insert messages" ON messages FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mission_progress" ON mission_progress FOR ALL USING (true);
CREATE POLICY "Anyone can update members" ON club_members FOR
UPDATE USING (true);
-- ============================================
-- Storage Bucket (run separately in Supabase)
-- ============================================
-- 1. Go to Storage in Supabase dashboard
-- 2. Create bucket named "club7-media"
-- 3. Make it public
-- 4. Set file size limit to 50MB