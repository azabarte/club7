-- ============================================
-- Club7 - Update Members to 5 Users
-- Run this in Supabase SQL Editor
-- ============================================
-- First, delete existing members and their related data
DELETE FROM mission_progress;
DELETE FROM reactions;
DELETE FROM messages;
DELETE FROM posts;
DELETE FROM club_members;
-- Insert the 5 new members
INSERT INTO club_members (name, avatar_url, stickers_unlocked, xp, level)
VALUES (
        'Javier',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Javier&hair=short01&hairColor=0a0a0a',
        ARRAY ['🎮', '⚽'],
        720,
        5
    ),
    (
        'Sofía',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sofia&hair=long16&hairColor=2c1810',
        ARRAY ['🌸', '🦄'],
        850,
        6
    ),
    (
        'Daniela',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Daniela&hair=long01&hairColor=6a4420',
        ARRAY ['🎨', '⭐'],
        680,
        5
    ),
    (
        'Carolina',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Carolina&hair=long19&hairColor=6a4420',
        ARRAY ['🎵', '🎧'],
        930,
        6
    ),
    (
        'Andrea',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Andrea&hair=long13&hairColor=6a4420',
        ARRAY ['📚', '🌈'],
        540,
        4
    );
-- Verify the update
SELECT *
FROM club_members
ORDER BY name;