import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { ClubMember, Post } from '../lib/supabase';
import { ArrowLeft, Grid, Film, User as UserIcon, Sparkles, Camera, Check, X } from 'lucide-react';

interface UserProfileProps {
  user: ClubMember;
  posts: Post[];
  onBack?: () => void;
  isCurrentUser: boolean;
}

// Avatar options using Dicebear Lorelei style
const avatarOptions = [
  { seed: 'Adventure1', bg: 'b6e3f4' },
  { seed: 'Adventure2', bg: 'ffd5dc' },
  { seed: 'Adventure3', bg: 'c0aede' },
  { seed: 'Adventure4', bg: 'd1f4d1' },
  { seed: 'Adventure5', bg: 'ffdfbf' },
  { seed: 'Cool1', bg: 'ffeaa7' },
  { seed: 'Cool2', bg: 'dfe6e9' },
  { seed: 'Cool3', bg: 'fab1a0' },
  { seed: 'Happy1', bg: 'a29bfe' },
  { seed: 'Happy2', bg: '81ecec' },
  { seed: 'Fun1', bg: 'fd79a8' },
  { seed: 'Fun2', bg: '74b9ff' },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, posts, onBack, isCurrentUser }) => {
  const { currentUser, updateAvatar } = useStore();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const userPosts = posts
    .filter(p => p.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stickersCount = user.stickers_unlocked?.length || 0;

  const getAvatarUrl = (seed: string, bg: string) =>
    `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=${bg}`;

  const handleAvatarSelect = async (seed: string, bg: string) => {
    setIsUpdating(true);
    const url = getAvatarUrl(seed, bg);
    const success = await updateAvatar(url);
    setIsUpdating(false);
    if (success) {
      setShowAvatarPicker(false);
    }
  };

  return (
    <div className="pt-20 pb-24 bg-gradient-to-br from-[#1a0533] via-[#0d1b2a] to-[#0a1628] min-h-screen overflow-y-auto">
      {/* Header */}
      {onBack && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-[#1a0533]/90 backdrop-blur-md z-30 flex items-center px-4 border-b border-white/10">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <span className="font-bold text-lg ml-2 text-white">{user.name}</span>
        </div>
      )}

      <div className="flex flex-col items-center px-6 mt-4">
        {/* Avatar with level ring */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#4ECDC4] via-[#45B7D1] to-[#FF6B9D] mb-2">
            <img
              src={user.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.name}`}
              alt={user.name}
              className="w-full h-full rounded-full border-4 border-[#0a1628] object-cover bg-gray-800"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B9D] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Lvl {user.level || 1}
          </div>

          {/* Change avatar button - only for current user */}
          {isCurrentUser && (
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -right-2 top-0 bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] p-2 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={16} />
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mt-4">{user.name}</h1>

        <div className="flex items-center gap-2 mt-2">
          <div className="bg-white/10 text-white/80 px-4 py-1 rounded-full text-xs font-bold border border-white/20">
            {isCurrentUser ? 'Eres tú 😎' : 'Miembro BestieSocial 🌟'}
          </div>
          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <Sparkles size={12} />
            {user.xp || 0} XP
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full mt-8 mb-8">
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{userPosts.length}</div>
            <div className="text-[10px] text-white/50 uppercase font-bold tracking-wide">Posts</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{stickersCount}</div>
            <div className="text-[10px] text-white/50 uppercase font-bold tracking-wide">Stickers</div>
          </div>
          <div className="bg-gradient-to-br from-[#4ECDC4]/20 to-[#FF6B9D]/20 p-4 rounded-2xl text-center border border-[#4ECDC4]/20">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4ECDC4] to-[#FF6B9D]">
              {user.xp || 0}
            </div>
            <div className="text-[10px] text-[#4ECDC4] uppercase font-bold tracking-wide">Puntos</div>
          </div>
        </div>

        {/* Unlocked stickers preview */}
        {stickersCount > 0 && (
          <div className="w-full mb-6">
            <h3 className="text-sm font-bold text-white/50 mb-2 px-1">STICKERS DESBLOQUEADOS</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {user.stickers_unlocked?.map((sticker, i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                  {sticker}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-1">
        <div className="flex-1 flex justify-center pb-3 border-b-2 border-[#4ECDC4] text-[#4ECDC4]">
          <Grid size={24} />
        </div>
        <div className="flex-1 flex justify-center pb-3 text-white/30">
          <UserIcon size={24} />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 px-1 pb-20">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square relative bg-gray-800 rounded-md overflow-hidden group">
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
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Ver</span>
            </div>
          </div>
        ))}
        {userPosts.length === 0 && (
          <div className="col-span-3 py-12 text-center">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-white/50 font-medium">
              {isCurrentUser ? '¡Comparte tu primer momento!' : 'Aún no hay publicaciones'}
            </p>
          </div>
        )}
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center">
          <div className="w-full max-w-lg bg-gradient-to-br from-[#1a0533] to-[#0a1628] rounded-t-3xl p-6 pb-10 border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Elige tu avatar</h2>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {avatarOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAvatarSelect(opt.seed, opt.bg)}
                  disabled={isUpdating}
                  className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#4ECDC4] transition-all hover:scale-105 disabled:opacity-50"
                >
                  <img
                    src={getAvatarUrl(opt.seed, opt.bg)}
                    alt={`Avatar ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {isUpdating && (
              <div className="text-center mt-4 text-[#4ECDC4]">
                Actualizando avatar...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;