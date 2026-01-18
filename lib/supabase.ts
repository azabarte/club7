import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Running in offline mode.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Type definitions
export interface ClubMember {
  id: string;
  name: string;
  telegram_username?: string;
  avatar_url: string | null;
  stickers_unlocked: string[];
  xp: number;
  level: number;
  is_admin: boolean;
  story?: string;
  password?: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  type: 'image' | 'video';
  url: string;
  caption: string | null;
  stickers: string[];
  created_at: string;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'audio' | 'sticker';
  content: string | null;
  media_url: string | null;
  created_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  reward_sticker: string | null;
  xp_reward: number;
  active_date: string;
  is_active: boolean;
}

export interface MissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time?: string;
  location?: string;
  event_type: 'birthday' | 'exam' | 'party' | 'special' | 'general';
  emoji: string;
  created_at: string;
}

// ============================================
// API Functions
// ============================================

// Auth / Members
export async function verifyClubPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_config')
    .select('club_pin')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error verifying PIN:', error);
    return pin === '7777'; // Fallback
  }
  return data?.club_pin === pin;
}

export async function getMembers(): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  return data || [];
}

export async function getMemberById(id: string): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .update({ avatar_url: avatarUrl })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating avatar:', error);
    return null;
  }
  return data;
}

export async function updateMemberDetails(memberId: string, updates: Partial<ClubMember>): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating member details:', error);
    return null;
  }
  return data;
}

// Posts
export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return data || [];
}

export async function createPost(
  userId: string,
  type: 'image' | 'video',
  url: string,
  caption?: string,
  stickers?: string[]
): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      type,
      url,
      caption: caption || null,
      stickers: stickers || []
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return null;
  }
  return data;
}

// Reactions
export async function getReactionsForPost(postId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId);

  if (error) return [];
  return data || [];
}

export async function addReaction(
  postId: string,
  userId: string,
  emoji: string
): Promise<boolean> {
  const { error } = await supabase
    .from('reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      emoji
    });

  return !error;
}

export async function removeReaction(
  postId: string,
  userId: string,
  emoji: string
): Promise<boolean> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  return !error;
}

// Comments
export async function getCommentsForPost(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data || [];
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }
  return data;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  return !error;
}

// Messages
export async function getMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data || [];
}

export async function sendMessage(
  userId: string,
  type: 'text' | 'image' | 'audio' | 'sticker',
  content?: string,
  mediaUrl?: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      type,
      content: content || null,
      media_url: mediaUrl || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }
  return data;
}

// Missions
export async function getMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('is_active', true)
    .order('xp_reward', { ascending: false });

  if (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
  return data || [];
}

export async function getMissionProgress(userId: string): Promise<MissionProgress[]> {
  const { data, error } = await supabase
    .from('mission_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) return [];
  return data || [];
}

export async function completeMission(
  userId: string,
  missionId: string,
  mission: Mission
): Promise<boolean> {
  // Mark mission as completed
  const { error: progressError } = await supabase
    .from('mission_progress')
    .upsert({
      user_id: userId,
      mission_id: missionId,
      completed: true,
      completed_at: new Date().toISOString()
    });

  if (progressError) return false;

  // Update user XP and unlock sticker
  const { data: member } = await supabase
    .from('club_members')
    .select('xp, stickers_unlocked')
    .eq('id', userId)
    .single();

  if (member) {
    const newXp = (member.xp || 0) + mission.xp_reward;
    const newLevel = Math.floor(newXp / 200) + 1; // 200 XP per level
    const newStickers = [...(member.stickers_unlocked || [])];

    if (mission.reward_sticker && !newStickers.includes(mission.reward_sticker)) {
      newStickers.push(mission.reward_sticker);
    }

    await supabase
      .from('club_members')
      .update({
        xp: newXp,
        level: newLevel,
        stickers_unlocked: newStickers
      })
      .eq('id', userId);
  }

  return true;
}

// Storage
export async function uploadMedia(
  file: File,
  folder: 'posts' | 'chat' | 'avatars'
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('club7-media')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('club7-media')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Realtime subscriptions
export function subscribeToMessages(
  callback: (message: Message) => void
) {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => callback(payload.new as Message)
    )
    .subscribe();
}

export function subscribeToPosts(
  callback: (post: Post) => void
) {
  return supabase
    .channel('posts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => callback(payload.new as Post)
    )
    .subscribe();
}

// ============================================
// Admin Functions
// ============================================

export async function deleteMessage(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }
  return true;
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }
  return true;
}

export async function createMember(name: string): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .insert({
      name,
      xp: 0,
      level: 1,
      stickers_unlocked: [],
      is_admin: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating member:', error);
    return null;
  }
  return data;
}

export async function deleteMember(memberId: string): Promise<boolean> {
  console.log('[DELETE MEMBER] Deleting member ID:', memberId);

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    console.error('[DELETE MEMBER] Error:', error);
    alert(`Error al borrar usuario: ${error.message}`);
    return false;
  }

  console.log('[DELETE MEMBER] Delete command sent successfully');
  return true;
}

// Realtime subscriptions for deletes
export function subscribeToMessageDeletes(
  callback: (messageId: string) => void
) {
  return supabase
    .channel('messages-delete')
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages' },
      (payload) => callback((payload.old as any).id)
    )
    .subscribe();
}

export function subscribeToPostDeletes(
  callback: (postId: string) => void
) {
  return supabase
    .channel('posts-delete')
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'posts' },
      (payload) => callback((payload.old as any).id)
    )
    .subscribe();
}

// Realtime subscription for comments
export function subscribeToComments(
  callback: (comment: Comment) => void
) {
  return supabase
    .channel('comments-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => callback(payload.new as Comment)
    )
    .subscribe();
}

export function subscribeToCommentDeletes(
  callback: (commentId: string) => void
) {
  return supabase
    .channel('comments-delete')
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'comments' },
      (payload) => callback((payload.old as any).id)
    )
    .subscribe();
}

// Realtime subscription for reactions
export function subscribeToReactions(
  callback: (reaction: Reaction, eventType: 'INSERT' | 'DELETE') => void
) {
  return supabase
    .channel('reactions-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reactions' },
      (payload) => callback(payload.new as Reaction, 'INSERT')
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'reactions' },
      (payload) => callback(payload.old as Reaction, 'DELETE')
    )
    .subscribe();
}

// ============================================
// Events (Agenda)
// ============================================

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data || [];
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return null;
  }
  return data;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }
  return true;
}

export function subscribeToEvents(
  callback: (event: Event) => void
) {
  return supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events' },
      (payload) => callback(payload.new as Event)
    )
    .subscribe();
}

export function subscribeToEventDeletes(
  callback: (eventId: string) => void
) {
  return supabase
    .channel('events-delete')
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'events' },
      (payload) => callback((payload.old as any).id)
    )
    .subscribe();
}
