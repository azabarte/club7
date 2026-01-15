import React from 'react';
import { useStore } from '../lib/store';
import { ClubMember, Post } from '../lib/supabase';
import { ArrowLeft, Grid, Film, User as UserIcon, Sparkles } from 'lucide-react';

interface UserProfileProps {
  user: ClubMember;
  posts: Post[];
  onBack?: () => void;
  isCurrentUser: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, posts, onBack, isCurrentUser }) => {
  const { currentUser } = useStore();

  const userPosts = posts
    .filter(p => p.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const photosCount = userPosts.filter(p => p.type === 'image').length;
  const videosCount = userPosts.filter(p => p.type === 'video').length;
  const stickersCount = user.stickers_unlocked?.length || 0;

  return (
    <div className="pt-20 pb-24 bg-white min-h-screen overflow-y-auto">
      {/* Header */}
      {onBack && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-30 flex items-center px-4 border-b border-gray-100">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <span className="font-bold text-lg ml-2">{user.name}</span>
        </div>
      )}

      <div className="flex flex-col items-center px-6 mt-4">
        {/* Avatar with level ring */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 mb-2">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
              alt={user.name}
              className="w-full h-full rounded-full border-4 border-white object-cover bg-gray-100"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Lvl {user.level || 1}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mt-4">{user.name}</h1>

        <div className="flex items-center gap-2 mt-2">
          <div className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-xs font-bold border border-indigo-100">
            {isCurrentUser ? 'Eres tú 😎' : 'Miembro Club7 🌟'}
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
            <Sparkles size={12} />
            {user.xp || 0} XP
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full mt-8 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{userPosts.length}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Posts</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{stickersCount}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Stickers</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {user.xp || 0}
            </div>
            <div className="text-[10px] text-indigo-500 uppercase font-bold tracking-wide">Puntos</div>
          </div>
        </div>

        {/* Unlocked stickers preview */}
        {stickersCount > 0 && (
          <div className="w-full mb-6">
            <h3 className="text-sm font-bold text-gray-500 mb-2 px-1">STICKERS DESBLOQUEADOS</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {user.stickers_unlocked?.map((sticker, i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {sticker}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-1">
        <div className="flex-1 flex justify-center pb-3 border-b-2 border-indigo-500 text-indigo-600">
          <Grid size={24} />
        </div>
        <div className="flex-1 flex justify-center pb-3 text-gray-300">
          <UserIcon size={24} />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 px-1 pb-20">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square relative bg-gray-100 rounded-md overflow-hidden group">
            {post.type === 'video' ? (
              <video src={post.url} className="w-full h-full object-cover" />
            ) : (
              <img src={post.url} alt="Post" className="w-full h-full object-cover" />
            )}
            {post.type === 'video' && (
              <div className="absolute top-1 right-1 text-white drop-shadow-md bg-black/30 rounded-full p-1">
                <Film size={14} />
              </div>
            )}
            {post.stickers && post.stickers.length > 0 && (
              <div className="absolute bottom-1 left-1 text-lg">
                {post.stickers[0]}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Ver</span>
            </div>
          </div>
        ))}
        {userPosts.length === 0 && (
          <div className="col-span-3 py-12 text-center">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-gray-500 font-medium">
              {isCurrentUser ? '¡Comparte tu primer momento!' : 'Aún no hay publicaciones'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;