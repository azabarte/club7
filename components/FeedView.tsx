import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Post, Reaction, Comment } from '../lib/supabase';
import { getOptimizedUrl } from '../lib/cloudinary';
import { Heart, MessageCircle, MoreHorizontal, Film, Loader2, Trash2, X, Smile, Send, Zap } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  onUserClick: (userId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ posts, onUserClick }) => {
  const { members, currentUser, postReactions, postComments, toggleReaction, addCommentAction, deleteCommentAction, isLoading, deletePostAction, refreshData } = useStore();
  const [menuOpenForPost, setMenuOpenForPost] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showReactorsFor, setShowReactorsFor] = useState<string | null>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const toggleCaption = (postId: string) => {
    setExpandedCaptions(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

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

  const addReaction = async (postId: string, emoji: string) => {
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
    setShowReactionPicker(null);
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

  // Post scroll animation (Scale + Fade + Shadow effect)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (postId) {
            setVisiblePosts(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(postId);
              }
              return newSet;
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    postRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [posts]);

  // Level-based emoji unlocks (Expanded & Fun)
  const userLevel = currentUser?.level || 1;

  // Level 1: Essentials
  const level1Emojis = ['❤️', '🔥', '😍', '😂', '🤩', '👏', '🙌', '👍'];

  // Level 2: Fun (Faces)
  const level2Emojis = ['😜', '🤪', '🥳', '😎', '🤓', '🤠', '🤡', '👻'];

  // Level 3: Actions & Gestures
  const level3Emojis = ['👋', '✌️', '🤞', '🤟', '🤝', '💪', '🙏', '👀'];

  // Level 4: Party & Celebration
  const level4Emojis = ['🎉', '🎊', '🎈', '🍾', '🥂', '🍻', '🎁', '🎂'];

  // Level 5: Animals
  const level5Emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

  // Level 6: Fantasy & Magic
  const level6Emojis = ['🦄', '🐲', '🧚', '🧜', '🧞', '🔮', '✨', '🌈'];

  // Level 7: Food & Drink
  const level7Emojis = ['🍕', '🍔', '🍟', '🌮', '🍩', '🍪', '🍦', '🍹'];

  // Level 8: Activity & Sports
  const level8Emojis = ['⚽', '🏀', '🏈', '🎾', '🎸', '🎨', '🎮', '🚀'];

  // Level 9: Hearts & Love
  const level9Emojis = ['💖', '💗', '💓', '💞', '💕', '💘', '💝', '💟'];

  // Level 10: Legendary (Premium/Animated-feel)
  const level10Emojis = ['👑', '💎', '💍', '🏆', '💯', '💥', '💣', '🪐'];

  // Build available emojis based on level
  let availableEmojis = [...level1Emojis];
  if (userLevel >= 2) availableEmojis = [...availableEmojis, ...level2Emojis];
  if (userLevel >= 3) availableEmojis = [...availableEmojis, ...level3Emojis];
  if (userLevel >= 4) availableEmojis = [...availableEmojis, ...level4Emojis];
  if (userLevel >= 5) availableEmojis = [...availableEmojis, ...level5Emojis];
  if (userLevel >= 6) availableEmojis = [...availableEmojis, ...level6Emojis];
  if (userLevel >= 7) availableEmojis = [...availableEmojis, ...level7Emojis];
  if (userLevel >= 8) availableEmojis = [...availableEmojis, ...level8Emojis];
  if (userLevel >= 9) availableEmojis = [...availableEmojis, ...level9Emojis];
  if (userLevel >= 10) availableEmojis = [...availableEmojis, ...level10Emojis];

  // Determine animation class based on emoji category
  const getEmojiAnimation = (emoji: string) => {
    if (level9Emojis.includes(emoji)) return 'animate-emoji-heartbeat';
    if (level2Emojis.includes(emoji)) return 'animate-emoji-wiggle';
    if (level4Emojis.includes(emoji)) return 'animate-emoji-party';
    if (level6Emojis.includes(emoji) || level10Emojis.includes(emoji)) return 'animate-emoji-spin';
    if (level5Emojis.includes(emoji) || level8Emojis.includes(emoji)) return 'animate-emoji-bounce';
    if (level10Emojis.includes(emoji)) return 'animate-emoji-float';
    return 'hover:scale-125 transition-transform';
  };

  // Quick emojis: Show a mix of unlocked emojis (focus on highest level + essentials)
  // Instead of just level 1, we show the last 4 unlocked + first 4 essentials
  const quickEmojis = [...availableEmojis].reverse().slice(0, 5).concat(level1Emojis.slice(0, 3));

  if (isLoading) {
    return (
      <div className="pb-24 pt-20 px-4 space-y-6 overflow-y-auto h-full">
        {/* Skeleton for Stories */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 animate-pulse" />
              <div className="w-14 h-3 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton for Header */}
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Skeleton for Posts */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Skeleton Header */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-2 w-16 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="w-6 h-6 bg-gray-100 rounded-full animate-pulse" />
            </div>
            {/* Skeleton Image */}
            <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
            {/* Skeleton Actions */}
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="w-12 h-10 bg-gray-100 rounded-full animate-pulse" />
                ))}
              </div>
              <div className="h-3 w-3/4 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
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
        const reactorUsers = reactions.map(r => getMember(r.user_id)).filter((m): m is NonNullable<ReturnType<typeof getMember>> => Boolean(m));
        const uniqueReactorUsers = [...new Map(reactorUsers.map(u => [u.id, u])).values()];

        const isVisible = visiblePosts.has(post.id);

        return (
          <div
            key={post.id}
            ref={(el) => {
              if (el) postRefs.current.set(post.id, el);
            }}
            data-post-id={post.id}
            className={`bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-500 ease-out ${isVisible
              ? 'opacity-100 scale-100 shadow-lg shadow-indigo-500/10'
              : 'opacity-0 scale-[0.96] shadow-sm translate-y-4'
              }`}
          >
            <div className="relative aspect-[4/5] bg-gray-100">
              {/* Media Content */}
              {post.type === 'video' ? (
                <>
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(post.id, el);
                    }}
                    src={getOptimizedUrl(post.url, 720)}
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
                <img src={getOptimizedUrl(post.url, 800)} alt="Post" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              )}

              {/* Header Overlay (User Info) */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent z-10 text-white flex items-center justify-between">
                <button onClick={() => author && onUserClick(author.id)} className="flex items-center gap-3">
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 to-purple-500">
                    <img
                      src={author?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author?.name || 'user'}`}
                      alt={author?.name || 'Usuario'}
                      className="w-9 h-9 rounded-full object-cover border-2 border-black"
                      loading="lazy"
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
                    {expandedCaptions[post.id] || post.caption.length <= 80
                      ? post.caption
                      : `${post.caption.substring(0, 80)}... `}

                    {post.caption.length > 80 && (
                      <button
                        onClick={() => toggleCaption(post.id)}
                        className="text-gray-300 hover:text-white text-sm font-bold ml-1 hover:underline"
                      >
                        {expandedCaptions[post.id] ? 'Leer menos' : 'Leer más'}
                      </button>
                    )}
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

            {/* Reactions & Comments Section (Always visible) */}
            <div className="p-4 pt-2">

              {/* Reaction Buttons */}
              <div className="flex gap-2 mb-3 flex-wrap scrollbar-hide overflow-x-auto">
                {quickEmojis.map(emoji => {
                  const count = reactionCounts[emoji] || 0;
                  const isActive = reactions.some((r: any) => r.user_id === currentUser?.id && r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => addReaction(post.id, emoji)}
                      className={`flex items-center gap-1 p-2 rounded-full transition-all active:scale-90 ${isActive
                        ? 'bg-indigo-50 border border-indigo-100 shadow-sm transform scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                    >
                      <span className={`text-2xl ${getEmojiAnimation(emoji)}`}>{emoji}</span>
                      {count > 0 && (
                        <span className={`text-xs font-bold ml-1 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-1"
                >
                  <span className="text-xl text-gray-500">+</span>
                </button>
              </div>

              {/* Expanded Reaction Picker */}
              {showReactionPicker === post.id && (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-800 text-sm">Elige tu reacción</h4>
                    <button onClick={() => setShowReactionPicker(null)} className="p-1 hover:bg-gray-100 rounded-full">
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                    {availableEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          addReaction(post.id, emoji);
                          setShowReactionPicker(null);
                        }}
                        className={`text-2xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-gray-50 ${getEmojiAnimation(emoji)}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {currentUser?.level < 10 && (
                    <div className="mt-3 text-center">
                      <p className="text-[10px] text-indigo-400 font-medium">✨ Sube de nivel para desbloquear más reacciones ✨</p>
                    </div>
                  )}
                </div>
              )}

              {/* Who Reacted - Visual List (Avatar + Emoji) */}
              {totalReactions > 0 && (
                <div className="mb-3 px-1">
                  <p className="text-xs text-gray-400 font-medium mb-2 ml-1">Reacciones</p>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-1">
                    {uniqueReactorUsers.map((member: any) => {
                      if (!member || !member.id) return null;
                      // Find the reaction(s) this user made
                      const userReactions = reactions.filter(r => r.user_id === member.id);
                      if (userReactions.length === 0) return null;
                      const emoji = userReactions[0].emoji; // Show primary reaction

                      return (
                        <div key={member.id} className="relative flex-shrink-0 group">
                          <img
                            src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                            className="w-9 h-9 rounded-full border border-gray-100 shadow-sm"
                            alt={member.name}
                            title={member.name}
                            loading="lazy"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-sm text-[10px] leading-none">
                            {emoji}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments List (Always Visible) */}
              <div className="space-y-4 mb-4">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm italic ml-1">Sin comentarios aún. ¡Sé el primero!</p>
                ) : (
                  comments.map((comment) => {
                    const commentAuthor = getMember(comment.user_id);
                    const canDelete = currentUser?.is_admin || comment.user_id === currentUser?.id;
                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        <img
                          src={commentAuthor?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${commentAuthor?.name || 'user'}`}
                          className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
                          alt=""
                          loading="lazy"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 inline-block max-w-full">
                            <span className="font-bold text-gray-900 text-sm block mb-0.5">{commentAuthor?.name || 'Usuario'}</span>
                            <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-1">
                            <span className="text-[10px] text-gray-400 font-medium">{formatTimeAgo(comment.created_at)}</span>
                            {canDelete && (
                              <button
                                onClick={async () => {
                                  if (window.confirm('¿Eliminar este comentario?')) {
                                    await deleteCommentAction(comment.id, post.id);
                                  }
                                }}
                                className="text-[10px] text-red-400 hover:text-red-600 font-medium"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input (Fixed at bottom of card) */}
              <div className="flex gap-2 items-center mt-2">
                <img
                  src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.name || 'me'}`}
                  className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-200"
                  alt=""
                />
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-indigo-300 focus-within:bg-white transition-all shadow-sm">
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={!commentText[post.id]?.trim()}
                    className="text-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed p-1 active:scale-90 transition-transform"
                  >
                    <Send size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default FeedView;