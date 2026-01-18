import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Post, Reaction, Comment } from '../lib/supabase';
import { Heart, MessageCircle, MoreHorizontal, Film, Loader2, Trash2, X, Smile, Send } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  onUserClick: (userId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ posts, onUserClick }) => {
  const { members, currentUser, postReactions, postComments, toggleReaction, addCommentAction, isLoading, deletePostAction } = useStore();
  const [menuOpenForPost, setMenuOpenForPost] = useState<string | null>(null);
  const [emojiPickerOpenFor, setEmojiPickerOpenFor] = useState<string | null>(null);
  const [showReactorsFor, setShowReactorsFor] = useState<string | null>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

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

  // More fun emojis organized by category
  const quickEmojis = ['❤️', '🔥', '😍', '😂', '🤩', '👏', '💀', '🙌'];

  const allEmojis = [
    // Love & Hearts
    '❤️', '💕', '💖', '💗', '💜', '💙', '🧡', '💚',
    // Fire & Energy
    '🔥', '⚡', '✨', '💥', '🌟', '⭐', '🎆', '🎇',
    // Faces
    '😍', '🥰', '😘', '🤗', '😂', '🤣', '😭', '🥹',
    '🤩', '😎', '🥳', '🤯', '😱', '🙃', '😏', '🤪',
    // Reactions
    '👏', '🙌', '💪', '🤝', '👍', '👎', '🤟', '✌️',
    // Objects
    '💀', '👀', '💯', '🎯', '🏆', '🎨', '🎵', '📸',
    // Animals
    '🦋', '🐱', '🐶', '🦄', '🐻', '🐼', '🦊', '🐸',
    // Food
    '🍕', '🌮', '🍔', '🍩', '🍦', '🎂', '🍿', '☕',
  ];

  if (isLoading) {
    return (
      <div className="pb-24 pt-20 px-4 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-20 px-4 space-y-6 overflow-y-auto h-full">
      {/* Stories / Active Members - Instagram Style (larger) */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {/* Filter out admin users unless current user is admin */}
        {members.filter(m => currentUser?.is_admin || !m.is_admin).map((member) => (
          <button
            key={member.id}
            onClick={() => onUserClick(member.id)}
            className="flex flex-col items-center gap-2 min-w-[80px] active:scale-95 transition-transform"
          >
            <div className={`w-20 h-20 rounded-full p-[3px] ${member.id === currentUser?.id ? 'bg-gradient-to-tr from-indigo-400 to-cyan-400' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
              <img
                src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                alt={member.name}
                className="w-full h-full rounded-full object-cover border-[3px] border-white bg-gray-100"
              />
            </div>
            <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{member.name}</span>
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
                    {/* Delete button - visible for admins or post owner */}
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

            <div className="relative aspect-[4/5] bg-gray-100">
              {post.type === 'video' ? (
                <>
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(post.id, el);
                    }}
                    src={post.url}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Film size={12} />
                    Video
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
              {/* Quick reaction buttons with counts */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {quickEmojis.map(emoji => {
                  const count = reactionCounts[emoji] || 0;
                  const isActive = reactions.some(r => r.user_id === currentUser?.id && r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(post.id, emoji)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all ${isActive
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 scale-105 shadow-sm border border-indigo-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                    >
                      <span className="text-lg">{emoji}</span>
                      {count > 0 && (
                        <span className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* More reactions button */}
                <button
                  onClick={() => setEmojiPickerOpenFor(emojiPickerOpenFor === post.id ? null : post.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${emojiPickerOpenFor === post.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                    }`}
                >
                  <Smile size={18} />
                </button>
              </div>

              {/* Extended emoji picker */}
              {emojiPickerOpenFor === post.id && (
                <div className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {allEmojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => handleReaction(post.id, emoji)}
                        className="w-10 h-10 rounded-xl hover:bg-white hover:scale-110 flex items-center justify-center text-xl transition-all hover:shadow-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show who reacted - with REAL users */}
              {totalReactions > 0 && (
                <button
                  onClick={() => setShowReactorsFor(showReactorsFor === post.id ? null : post.id)}
                  className="flex items-center gap-2 mb-3 hover:bg-gray-50 rounded-full px-2 py-1 -ml-2 transition-colors"
                >
                  {/* Stack of avatars who actually reacted */}
                  <div className="flex -space-x-2">
                    {uniqueReactorUsers.slice(0, 3).map((member) => (
                      <img
                        key={member?.id}
                        src={member?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member?.name}`}
                        className="w-6 h-6 rounded-full border-2 border-white"
                        alt=""
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    <span className="font-bold">{uniqueReactorUsers[0]?.name}</span>
                    {uniqueReactorUsers.length > 1 && (
                      <> y <span className="font-bold">{uniqueReactorUsers.length - 1} más</span></>
                    )}
                    {' reaccionaron '}
                    {uniqueEmojis.slice(0, 3).join('')}
                  </span>
                </button>
              )}

              {/* Expanded reactors list - REAL users */}
              {showReactorsFor === post.id && totalReactions > 0 && (
                <div className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-600 mb-2">Reacciones</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {reactions.map((reaction) => {
                      const member = getMember(reaction.user_id);
                      if (!member) return null;
                      return (
                        <div key={reaction.id} className="flex items-center gap-2">
                          <img
                            src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                            className="w-8 h-8 rounded-full"
                            alt=""
                          />
                          <span className="text-sm font-medium text-gray-700 flex-1">{member.name}</span>
                          <span className="text-lg">{reaction.emoji}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {post.caption && (
                <p className="text-gray-800 text-lg mb-3">
                  <span className="font-bold mr-2">{author?.name}</span>
                  {post.caption}
                </p>
              )}

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
                      return (
                        <div key={comment.id} className="flex gap-2">
                          <img
                            src={commentAuthor?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${commentAuthor?.name || 'user'}`}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            alt=""
                          />
                          <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                            <span className="font-bold text-gray-800 text-sm">{commentAuthor?.name || 'Usuario'}</span>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                            <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                          </div>
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
                          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
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
          </div>
        );
      })}
    </div>
  );
};

export default FeedView;