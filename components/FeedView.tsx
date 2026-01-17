import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Post } from '../lib/supabase';
import { Heart, MessageCircle, MoreHorizontal, Film, Loader2, Trash2, X } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  onUserClick: (userId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ posts, onUserClick }) => {
  const { members, currentUser, postReactions, toggleReaction, isLoading, deletePostAction } = useStore();
  const [menuOpenForPost, setMenuOpenForPost] = useState<string | null>(null);

  const getMember = (id: string) => members.find(m => m.id === id);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  const handleReaction = async (postId: string, emoji: string) => {
    await toggleReaction(postId, emoji);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      await deletePostAction(postId);
      setMenuOpenForPost(null);
    }
  };

  const quickEmojis = ['❤️', '🔥', '😍', '😂', '🤩'];

  if (isLoading) {
    return (
      <div className="pb-24 pt-20 px-4 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-20 px-4 space-y-6 overflow-y-auto h-full">
      {/* Stories / Active Members */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onUserClick(member.id)}
            className="flex flex-col items-center gap-1 min-w-[70px] active:scale-95 transition-transform"
          >
            <div className={`w-16 h-16 rounded-full p-[3px] ${member.id === currentUser?.id ? 'bg-gradient-to-tr from-indigo-400 to-cyan-400' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
              <img
                src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                alt={member.name}
                className="w-full h-full rounded-full object-cover border-2 border-white bg-gray-100"
              />
            </div>
            <span className="text-xs font-medium text-gray-700">{member.name}</span>
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 px-2">Lo último ⚡</h2>

      {posts.length === 0 && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-500 font-medium">¡Sé el primero en publicar algo!</p>
          <p className="text-gray-400 text-sm mt-1">Toca la cámara para empezar</p>
        </div>
      )}

      {posts.map((post) => {
        const author = getMember(post.user_id);
        const reactions = postReactions[post.id] || post.stickers || [];

        return (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <button onClick={() => author && onUserClick(author.id)} className="flex items-center gap-3">
                <img
                  src={author?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author?.name || 'user'}`}
                  alt={author?.name || 'Usuario'}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100"
                />
                <div className="text-left">
                  <span className="font-bold text-gray-800 block">{author?.name || 'Usuario'}</span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</span>
                </div>
              </button>
              <div className="relative">
                <button
                  onClick={() => setMenuOpenForPost(menuOpenForPost === post.id ? null : post.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <MoreHorizontal />
                </button>
                {/* Dropdown menu */}
                {menuOpenForPost === post.id && (
                  <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10 min-w-[140px]">
                    {currentUser?.is_admin && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    )}
                    <button
                      onClick={() => setMenuOpenForPost(null)}
                      className="w-full px-4 py-2 text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <X size={16} />
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative aspect-[4/5] bg-gray-100">
              {post.type === 'video' ? (
                <>
                  <video src={post.url} controls className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <img src={post.url} alt="Post" className="w-full h-full object-cover" />
              )}

              {/* Sticker overlay */}
              {post.stickers && post.stickers.length > 0 && (
                <div className="absolute bottom-4 right-4 text-4xl drop-shadow-lg animate-bounce">
                  {post.stickers[0]}
                </div>
              )}
            </div>

            <div className="p-4">
              {/* Quick reaction buttons */}
              <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                {quickEmojis.map(emoji => {
                  const isActive = reactions.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(post.id, emoji)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive
                        ? 'bg-indigo-100 scale-110 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      {emoji}
                    </button>
                  );
                })}

                {/* Show unique reactions count */}
                {reactions.length > 0 && (
                  <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                    <span className="text-sm text-gray-600 font-medium">{reactions.length}</span>
                  </div>
                )}
              </div>

              {post.caption && (
                <p className="text-gray-800 text-lg">
                  <span className="font-bold mr-2">{author?.name}</span>
                  {post.caption}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedView;