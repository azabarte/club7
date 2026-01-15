export interface User {
  id: string;
  name: string;
  avatar: string;
  role?: 'admin' | 'member';
  stickersUnlocked: string[];
}

export interface Post {
  id: string;
  userId: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  timestamp: Date;
  reactions: string[]; // List of emojis
  stickers: string[];
}

export interface Message {
  id: string;
  userId: string;
  text?: string;
  mediaUrl?: string;
  type: 'text' | 'image' | 'audio' | 'sticker';
  timestamp: Date;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  reward: string; // e.g., a new sticker
}

export enum AppTab {
  HOME = 'home',
  CHAT = 'chat',
  CAMERA = 'camera',
  MISSIONS = 'missions',
  PROFILE = 'profile',
}