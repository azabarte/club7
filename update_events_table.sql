-- Add new columns to events table
-- Run this in Supabase SQL Editor
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_time TEXT;
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location TEXT;