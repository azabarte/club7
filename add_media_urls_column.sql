-- ============================================
-- Add media_urls column for multi-image posts
-- Run this in Supabase SQL Editor
-- ============================================
-- Add the media_urls column (array of text) to support multiple images/videos
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS media_urls TEXT [] DEFAULT '{}';
-- Migrate existing posts: copy the single url to media_urls array
UPDATE posts
SET media_urls = ARRAY [url]
WHERE media_urls IS NULL
    OR media_urls = '{}';