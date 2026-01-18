-- Add story column to club_members table
-- Run this in Supabase SQL Editor
ALTER TABLE club_members
ADD COLUMN IF NOT EXISTS story TEXT;