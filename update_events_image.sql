-- Add image_url column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS image_url TEXT;