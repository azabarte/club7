-- ============================================
-- Add Comments Table
-- Run this in Supabase SQL Editor
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Anyone can read comments" ON comments FOR
SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON comments FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own comments" ON comments FOR DELETE USING (true);