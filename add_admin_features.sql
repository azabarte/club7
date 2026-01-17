-- ============================================
-- BestieSocial - Admin Features Migration
-- Run this in Supabase SQL Editor
-- ============================================
-- Add is_admin column to club_members
ALTER TABLE club_members
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
-- Update club name to BestieSocial
UPDATE club_config
SET club_name = 'BestieSocial'
WHERE id = 1;
-- Create an Admin user with admin privileges
INSERT INTO club_members (
        name,
        avatar_url,
        stickers_unlocked,
        xp,
        level,
        is_admin
    )
VALUES (
        'Admin',
        'https://api.dicebear.com/9.x/lorelei/svg?seed=Admin&backgroundColor=a0c9f1',
        ARRAY ['🛡️', '⚙️'],
        1000,
        10,
        TRUE
    ) ON CONFLICT DO NOTHING;
-- Add delete policy for messages (allows any authenticated user to delete for now - RLS will be enhanced later)
DROP POLICY IF EXISTS "Anyone can delete messages" ON messages;
CREATE POLICY "Anyone can delete messages" ON messages FOR DELETE USING (true);
-- Add delete policy for posts (allows any authenticated user to delete for now - RLS will be enhanced later)
DROP POLICY IF EXISTS "Anyone can delete posts" ON posts;
CREATE POLICY "Anyone can delete posts" ON posts FOR DELETE USING (true);
-- ============================================
-- IMPORTANT: Enable Realtime for DELETE events
-- Go to Supabase Dashboard > Database > Replication
-- Make sure 'messages' and 'posts' tables have DELETE enabled
-- ============================================
-- Verify admin user was created
SELECT id,
    name,
    is_admin
FROM club_members
WHERE is_admin = TRUE;