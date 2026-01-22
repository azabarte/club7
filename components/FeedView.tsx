import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Post, Reaction, Comment } from '../lib/supabase';
import { Heart, MessageCircle, MoreHorizontal, Film, Loader2, Trash2, X, Smile, Send, Zap } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  onUserClick: (userId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ posts, onUserClick }) => {
  const { members, currentUser, postReactions, postComments, toggleReaction, addCommentAction, deleteCommentAction, isLoading, deletePostAction, refreshData } = useStore();
  const [menuOpenForPost, setMenuOpenForPost] = useState<string | null>(null);
  const [emojiPickerOpenFor, setEmojiPickerOpenFor] = useState<string | null>(null);
  const [showReactorsFor, setShowReactorsFor] = useState<string | null>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData(true);
    setTimeout(() => setIsRefreshing(false), 800); // Visual delay
  };

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
    // Check if user has reached 3 reactions on this post
    const reactions = postReactions[postId] || [];
    const userReactions = reactions.filter(r => r.user_id === currentUser?.id);
    const hasThisEmoji = userReactions.some(r => r.emoji === emoji);

    // If user already has 3 reactions and this isn't removing one, block it
    if (userReactions.length >= 3 && !hasThisEmoji) {
      alert('¡Máximo 3 reacciones por publicación! Quita una para añadir otra.');
      return;
    }

    await toggleReaction(postId, emoji);
    setEmojiPickerOpenFor(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      await deletePostAction(postId);
      setMenuOpenForPost(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    await addCommentAction(postId, text);
    setCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  // Video auto-play on scroll (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => { }); // Ignore autoplay errors
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 } // Play when 60% visible
    );

    videoRefs.current.forEach((video) => {
      observer.observe(video);
    });

    return () => observer.disconnect();
  }, [posts]);

  // Level-based emoji unlocks
  const userLevel = currentUser?.level || 1;

  // Base emojis available to everyone (Level 1-2)
  const baseEmojis = ['❤️', '🔥', '😍', '😂', '🤩', '👏', '💀', '🙌'];

  // Level 3-4: More emojis
  const level3Emojis = ['💕', '💖', '💗', '💜', '💙', '🧡', '💚', '⚡', '✨', '💥', '🌟', '⭐', '🎆', '🎇'];

  // Level 5-6: Extended set
  const level5Emojis = ['🥰', '😘', '🤗', '🤣', '😭', '🥹', '😎', '🥳', '🤯', '😱', '🙃', '😏', '🤪', '💪', '🤝', '👍'];

  // Level 7+: Premium emojis
  const level7Emojis = ['🦋', '🐱', '🐶', '🦄', '🐻', '🐼', '🦊', '🐸', '🍕', '🌮', '🍔', '🍩', '🍦', '🎂', '🍿', '☕', '👎', '🤟', '✌️', '👀', '💯', '🎯', '🏆', '🎨', '🎵', '📸'];

  // Build available emojis based on level
  let availableEmojis = [...baseEmojis];
  if (userLevel >= 3) availableEmojis = [...availableEmojis, ...level3Emojis];
  if (userLevel >= 5) availableEmojis = [...availableEmojis, ...level5Emojis];
  if (userLevel >= 7) availableEmojis = [...availableEmojis, ...level7Emojis];

  // Quick emojis are always the base ones
  const quickEmojis = baseEmojis;

  if (isLoading) {
    return (
      <div className="pb-24 pt-20 px-4 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-20 px-4 space-y-6 overflow-y-auto h-full relative">

      {/* Stories / Active Members - Instagram Style (larger) */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {/* Sort: current user first, then others. Only hide user named 'Admin' */}
        {[
          ...(currentUser ? [currentUser] : []),
          ...members.filter(m => m.id !== currentUser?.id && m.name.toLowerCase() !== 'admin')
        ].map((member) => {
          const isCurrentUser = member.id === currentUser?.id;
          return (
            <button
              key={member.id}
              onClick={() => onUserClick(member.id)}
              className="flex flex-col items-center gap-2 min-w-[80px] active:scale-95 transition-transform"
            >
              {/* Double ring for current user */}
              {isCurrentUser ? (
                <div className="relative">
                  <div className="w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-400 animate-pulse">
                    <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500">
                      <img
                        src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover border-[3px] border-white bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    TÚ
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                  <img
                    src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover border-[3px] border-white bg-gray-100"
                  />
                </div>
              )}
              <span className={`text-xs font-medium truncate max-w-[80px] ${isCurrentUser ? 'text-amber-600 font-bold' : 'text-gray-700'}`}>
                {isCurrentUser ? 'Tu historia' : member.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-2 mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Lo último</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 group focus:outline-none ml-1 transition-all active:scale-95"
          disabled={isRefreshing}
          title="Actualizar novedades"
        >
          <img
            src="/assets/update-icon.png"
            alt="Actualizar"
            className={`w-9 h-9 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className={`text-sm font-bold text-amber-500 transition-opacity ${isRefreshing ? 'opacity-80' : 'opacity-100'}`}>
            Actualizar
          </span>
        </button>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-500 font-medium">¡Sé el primero en publicar algo!</p>
          <p className="text-gray-400 text-sm mt-1">Toca la cámara para empezar</p>
        </div>
      )}

      {posts.map((post) => {
        const author = getMember(post.user_id);
        const reactions = postReactions[post.id] || [];
        const comments = postComments[post.id] || [];

        // Count reactions by emoji
        const reactionCounts: Record<string, number> = {};
        reactions.forEach((r: Reaction) => {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });

        // Get unique emojis used
        const uniqueEmojis = Object.keys(reactionCounts);
        const totalReactions = reactions.length;

        // Get reactors with their info
        const reactorUsers = reactions.map(r => getMember(r.user_id)).filter((m): m is NonNullable<typeof m> => Boolean(m));
        const uniqueReactorUsers = [...new Map(reactorUsers.map(u => [u.id, u])).values()];

        return (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative aspect-[4/5] bg-gray-100">
              {/* Media Content */}
              {post.type === 'video' ? (
                <>
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(post.id, el);
                    }}
                    src={post.url}
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-16 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-20">
                    <Film size={12} />
                    Video
                  </div>
                </>
              ) : (
                <img src={post.url} alt="Post" className="w-full h-full object-cover" />
              )}

              {/* Header Overlay (User Info) */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent z-10 text-white flex items-center justify-between">
                <button onClick={() => author && onUserClick(author.id)} className="flex items-center gap-3">
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 to-purple-500">
                    <img
                      src={author?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author?.name || 'user'}`}
                      alt={author?.name || 'Usuario'}
                      className="w-9 h-9 rounded-full object-cover border-2 border-black"
                    />
                  </div>
                  <div className="text-left drop-shadow-md">
                    <span className="font-bold block text-sm shadow-black/50">{author?.name || 'Usuario'}</span>
                    <span className="text-[10px] text-gray-300 shadow-black/50">{formatTimeAgo(post.created_at)}</span>
                  </div>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenForPost(menuOpenForPost === post.id ? null : post.id)}
                    className="text-white/80 hover:text-white p-2 rounded-full bg-black/20 backdrop-blur-md"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {/* Dropdown menu */}
                  {menuOpenForPost === post.id && (
                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[140px]">
                      {(currentUser?.is_admin || post.user_id === currentUser?.id) && (
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

              {/* Caption Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
                {post.caption && (
                  <p className="text-white text-base leading-snug drop-shadow-md mb-2">
                    <span className="font-bold mr-2 text-sm opacity-90">{author?.name}</span>
                    {post.caption}
                  </p>
                )}

                {/* Sticker overlay moved slightly up to not conflict with caption */}
                {post.stickers && post.stickers.length > 0 && (
                  <div className="absolute bottom-20 right-4 text-5xl drop-shadow-lg animate-bounce z-20">
                    {post.stickers[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Comments section */}
            <div className="border-t border-gray-100 pt-3 mt-2">
              {/* Show comments count / toggle */}
              <button
                onClick={() => setShowCommentsFor(showCommentsFor === post.id ? null : post.id)}
                className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-1"
              >
                <MessageCircle size={16} />
                {comments.length > 0 ? `Ver ${comments.length} comentario${comments.length > 1 ? 's' : ''}` : 'Comentar'}
              </button>

              {/* Comments list */}
              {showCommentsFor === post.id && (
                <div className="space-y-3 mb-3">
                  {comments.map((comment) => {
                    const commentAuthor = getMember(comment.user_id);
                    const canDelete = currentUser?.is_admin || comment.user_id === currentUser?.id;
                    return (
                      <div key={comment.id} className="flex gap-2 group">
                        <img
                          src={commentAuthor?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${commentAuthor?.name || 'user'}`}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          alt=""
                        />
                        <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                          <span className="font-bold text-gray-800 text-sm">{commentAuthor?.name || 'Usuario'}</span>
                          <p className="text-black text-sm">{comment.content}</p>
                          <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={async () => {
                              if (window.confirm('¿Eliminar este comentario?')) {
                                await deleteCommentAction(comment.id, post.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all self-center p-1"
                            title="Eliminar comentario"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add comment input */}
                  <div className="flex gap-2 items-center">
                    <img
                      src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.name || 'me'}`}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      alt=""
                    />
                    <div className="flex-1 flex gap-2 bg-gray-50 rounded-full px-3 py-2">
                      <input
                        type="text"
                        placeholder="Añade un comentario..."
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="text-indigo-500 hover:text-indigo-600"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default FeedView;