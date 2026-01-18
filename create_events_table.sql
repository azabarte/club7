-- ============================================
-- Events Table for Agenda Feature
-- Run this in Supabase SQL Editor
-- ============================================
-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type TEXT DEFAULT 'general',
    emoji TEXT DEFAULT '📅',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Anyone can read events" ON events FOR
SELECT USING (true);
CREATE POLICY "Anyone can insert events" ON events FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete events" ON events FOR DELETE USING (true);
CREATE POLICY "Anyone can update events" ON events FOR
UPDATE USING (true);
-- Enable Realtime for events
-- Go to Supabase Dashboard -> Database -> Replication -> Enable for 'events' table