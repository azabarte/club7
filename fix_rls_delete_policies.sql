-- ============================================
-- FIX: Add missing RLS policies for club_members
-- Run this in Supabase SQL Editor
-- ============================================
-- Allow anyone to delete members (for admin panel)
CREATE POLICY "Anyone can delete members" ON club_members FOR DELETE USING (true);
-- Allow anyone to insert members (for creating new users)
CREATE POLICY "Anyone can insert members" ON club_members FOR
INSERT WITH CHECK (true);
-- Also add delete policy for posts (so admins/owners can delete posts)
CREATE POLICY "Anyone can delete posts" ON posts FOR DELETE USING (true);
-- Add delete policy for messages
CREATE POLICY "Anyone can delete messages" ON messages FOR DELETE USING (true);