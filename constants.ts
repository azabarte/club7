import { User, Post, Message, Mission } from './types';

// The requested video URL for the landing page
export const LANDING_VIDEO_URL = "https://fhufjkzbbxpbyylsmjsu.supabase.co/storage/v1/object/sign/IMAGENES/portadawebp.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lOGY1YjY0ZS0xMzcxLTRmOWItODQyZS1mZGU4MmU3NDNlYTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJTUFHRU5FUy9wb3J0YWRhd2VicC5tcDQiLCJpYXQiOjE3Njg1MDQxNDQsImV4cCI6MjA4Mzg2NDE0NH0.RkIqPgEqoc5SSTntzy7ZXGthOeD7-OFx-WDsh9Inr4s";

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Leo', avatar: 'https://picsum.photos/100/100?random=1', stickersUnlocked: ['🔥', '🚀'] },
  { id: 'u2', name: 'Sofía', avatar: 'https://picsum.photos/100/100?random=2', stickersUnlocked: ['🌸', '🦄'] },
  { id: 'u3', name: 'Max', avatar: 'https://picsum.photos/100/100?random=3', stickersUnlocked: ['🎮', '🍕'] },
  { id: 'u4', name: 'Lucía', avatar: 'https://picsum.photos/100/100?random=4', stickersUnlocked: ['🎨', '⭐'] },
  { id: 'u5', name: 'Hugo', avatar: 'https://picsum.photos/100/100?random=5', stickersUnlocked: ['⚽', '🏆'] },
  { id: 'u6', name: 'Emma', avatar: 'https://picsum.photos/100/100?random=6', stickersUnlocked: ['🎵', '🎧'] },
  { id: 'u7', name: 'Dani', avatar: 'https://picsum.photos/100/100?random=7', stickersUnlocked: ['🐱', '🍩'] },
];

export const CURRENT_USER = MOCK_USERS[0];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=10',
    caption: 'Tarde de skate 🛹🤪',
    timestamp: new Date(Date.now() - 3600000),
    reactions: ['🔥', '😎', '🤙'],
    stickers: ['🔥']
  },
  {
    id: 'p2',
    userId: 'u3',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=11',
    caption: 'Mi nuevo setup gamer 🎮',
    timestamp: new Date(Date.now() - 7200000),
    reactions: ['🤩', '😮'],
    stickers: ['🎮']
  },
  {
    id: 'p3',
    userId: 'u6',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=12',
    caption: 'Ensayando para el concierto 🎸',
    timestamp: new Date(Date.now() - 86400000),
    reactions: ['🎵', '👏', '❤️'],
    stickers: ['⭐']
  },
  {
    id: 'p4',
    userId: 'u4',
    type: 'video',
    url: 'https://joy1.videvo.net/videvo_files/video/free/2019-11/large_watermarked/190301_1_25_11_preview.mp4',
    caption: 'Miren este atardecer! 🌅',
    timestamp: new Date(Date.now() - 90000000),
    reactions: ['😍', '🧡'],
    stickers: []
  },
  {
    id: 'p5',
    userId: 'u1',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=13',
    caption: 'Pizza night con el team 🍕',
    timestamp: new Date(Date.now() - 95000000),
    reactions: ['🤤', '🍕'],
    stickers: ['🍕', '🔥']
  },
  {
    id: 'p6',
    userId: 'u5',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=14',
    caption: 'Ganamos el partido! ⚽🏆',
    timestamp: new Date(Date.now() - 100000000),
    reactions: ['🏆', '💪', '⚽'],
    stickers: ['🏆']
  },
  {
    id: 'p7',
    userId: 'u7',
    type: 'video',
    url: 'https://joy1.videvo.net/videvo_files/video/free/2019-05/large_watermarked/190416_06_Bialet-Masse_06_preview.mp4',
    caption: 'Mi gato haciendo locuras 😹',
    timestamp: new Date(Date.now() - 120000000),
    reactions: ['😂', '🐱'],
    stickers: ['🐱']
  },
  {
    id: 'p8',
    userId: 'u2',
    type: 'image',
    url: 'https://picsum.photos/400/500?random=15',
    caption: 'Estudiando... o intentándolo 📚😅',
    timestamp: new Date(Date.now() - 150000000),
    reactions: ['😭', '📚'],
    stickers: []
  }
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', userId: 'u2', type: 'text', text: '¿Quién se apunta al cine mañana? 🍿', timestamp: new Date(Date.now() - 300000) },
  { id: 'm2', userId: 'u4', type: 'text', text: '¡Yo! 🙋‍♀️', timestamp: new Date(Date.now() - 240000) },
  { id: 'm3', userId: 'u5', type: 'text', text: 'Yo también voy', timestamp: new Date(Date.now() - 200000) },
  { id: 'm4', userId: 'u3', type: 'sticker', text: '🔥', timestamp: new Date(Date.now() - 100000) },
];

export const DAILY_MISSIONS: Mission[] = [
  { id: 'mi1', title: 'Cazador Azul', description: 'Sube una foto de algo azul', icon: '🔵', completed: false, reward: '🐳' },
  { id: 'mi2', title: 'Comediante', description: 'Graba un video haciendo una cara graciosa', icon: '🤪', completed: true, reward: '🎭' },
  { id: 'mi3', title: 'Buenos Días', description: 'Manda un audio saludando al grupo', icon: '☀️', completed: false, reward: '🌅' },
];