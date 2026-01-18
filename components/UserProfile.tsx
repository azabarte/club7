import React, { useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { ClubMember, Post, uploadMedia } from '../lib/supabase';
import { ArrowLeft, Grid, Film, User as UserIcon, Sparkles, Camera, Check, X, UserPlus, Shield, Loader2, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import CameraView from './CameraView';

interface UserProfileProps {
  user: ClubMember;
  posts: Post[];
  onBack?: () => void;
  isCurrentUser: boolean;
}

// Massive avatar catalog with multiple styles
const avatarStyles = [
  {
    name: '🎨 Cartoon',
    style: 'adventurer',
    seeds: ['Felix', 'Aneka', 'Milo', 'Luna', 'Zoe', 'Max', 'Chloe', 'Leo', 'Nala', 'Oscar', 'Bella', 'Simba'],
    bgs: ['b6e3f4', 'ffd5dc', 'c0aede', 'd1f4d1', 'ffdfbf', 'ffeaa7']
  },
  {
    name: '✨ Elegante',
    style: 'lorelei',
    seeds: ['Princess', 'Queen', 'Star', 'Moon', 'Rose', 'Violet', 'Aurora', 'Celeste', 'Diamond', 'Pearl', 'Ruby', 'Emerald'],
    bgs: ['ffd5dc', 'c0aede', 'f8b4d9', 'fbbf24', 'a78bfa', 'f472b6']
  },
  {
    name: '😎 Emoji Style',
    style: 'avataaars',
    seeds: ['Cool1', 'Happy1', 'Fun1', 'Smile1', 'Wink1', 'Party1', 'Dance1', 'Rock1', 'Peace1', 'Love1', 'Star1', 'Fire1'],
    bgs: ['65c3c8', 'ef9fbc', 'eeaf3a', '516dff', 'f97316', '22c55e']
  },
  {
    name: '🎮 Pixel Art',
    style: 'pixel-art',
    seeds: ['Player1', 'Hero1', 'Ninja1', 'Knight1', 'Mage1', 'Rogue1', 'Warrior1', 'Archer1', 'Pirate1', 'Viking1', 'Samurai1', 'Wizard1'],
    bgs: ['b6e3f4', 'c0aede', 'ffd5dc', 'd1f4d1', 'ffdfbf', '81ecec']
  },
  {
    name: '🤖 Robots',
    style: 'bottts',
    seeds: ['Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5', 'Bot6', 'Bot7', 'Bot8', 'Bot9', 'Bot10', 'Bot11', 'Bot12'],
    bgs: ['0ea5e9', '8b5cf6', 'ec4899', '14b8a6', 'f59e0b', '6366f1']
  },
  {
    name: '😄 Divertido',
    style: 'big-smile',
    seeds: ['Alegre1', 'Risa1', 'Feliz1', 'Sonrisa1', 'Joy1', 'Happy2', 'Cheerful1', 'Sunny1', 'Bright1', 'Glow1', 'Shine1', 'Sparkle1'],
    bgs: ['fbbf24', 'f472b6', '34d399', 'f87171', 'a78bfa', '38bdf8']
  },
  {
    name: '🐱 Animales',
    style: 'thumbs',
    seeds: ['Cat1', 'Dog1', 'Fox1', 'Bear1', 'Panda1', 'Tiger1', 'Lion1', 'Wolf1', 'Bunny1', 'Owl1', 'Penguin1', 'Koala1'],
    bgs: ['ffd5dc', 'd1f4d1', 'ffeaa7', 'c0aede', 'b6e3f4', 'fab1a0']
  },
  {
    name: '👤 Minimalista',
    style: 'initials',
    seeds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    bgs: ['0ea5e9', 'ec4899', '8b5cf6', '14b8a6', 'f59e0b', 'ef4444']
  }
];

// Generate avatar URL for any style
const getAvatarUrlForStyle = (style: string, seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;

// Legacy simple function for default avatar options
const avatarOptions = avatarStyles[0].seeds.slice(0, 12).map((seed, i) => ({
  seed,
  bg: avatarStyles[0].bgs[i % avatarStyles[0].bgs.length]
}));

const UserProfile: React.FC<UserProfileProps> = ({ user, posts, onBack, isCurrentUser }) => {
  const { currentUser, updateAvatar, addNewMember, members, updateMember, deleteMemberAction } = useStore();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingUser, setEditingUser] = useState<ClubMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', password: '', xp: '', level: '', is_admin: false, stickers_unlocked: [] as string[] });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreateUser = async () => {
    if (!newUserName.trim() || isCreatingUser) return;

    setIsCreatingUser(true);
    const member = await addNewMember(newUserName.trim());
    setIsCreatingUser(false);

    if (member) {
      setNewUserName('');
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
    }
  };

  const handleCameraCapture = async (file: File) => {
    // Direct Upload Flow - always use the photo directly
    setIsUpdating(true);
    try {
      const uploadedUrl = await uploadMedia(file, 'avatars');
      if (uploadedUrl) {
        const success = await updateAvatar(uploadedUrl);
        if (success) {
          setShowAvatarPicker(false);
        }
      } else {
        setAiError('Error al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAiError('Error al subir la foto');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle photo upload from file input
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    setAiError(null);

    try {
      const uploadedUrl = await uploadMedia(file, 'avatars');
      if (uploadedUrl) {
        const success = await updateAvatar(uploadedUrl);
        if (success) {
          setShowAvatarPicker(false);
        } else {
          setAiError('Error al guardar el avatar');
        }
      } else {
        setAiError('Error al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setAiError('Error al subir la foto');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle selecting an avatar from the catalog
  const handleStyleAvatarSelect = async (style: string, seed: string, bg: string) => {
    setIsUpdating(true);
    const url = getAvatarUrlForStyle(style, seed, bg);
    const success = await updateAvatar(url);
    setIsUpdating(false);
    if (success) {
      setShowAvatarPicker(false);
    }
  };

  const isAdmin = currentUser?.is_admin;

  const handleEditClick = (member: ClubMember) => {
    setEditingUser(member);
    setEditForm({
      name: member.name,
      password: member.password || '1234',
      xp: member.xp.toString(),
      level: member.level.toString(),
      is_admin: member.is_admin,
      stickers_unlocked: member.stickers_unlocked || []
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    await updateMember(editingUser.id, {
      name: editForm.name,
      password: editForm.password,
      xp: parseInt(editForm.xp) || 0,
      level: parseInt(editForm.level) || 1,
      is_admin: editForm.is_admin
    });

    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;

    // Don't allow deleting yourself
    if (currentUser && editingUser.id === currentUser.id) {
      alert('No puedes eliminarte a ti mismo');
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro que quieres eliminar a ${editingUser.name}? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    const success = await deleteMemberAction(editingUser.id);
    setIsDeleting(false);

    if (success) {
      setEditingUser(null);
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
              className="absolute bottom-0 right-0 bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] p-2 rounded-full text-white shadow-lg hover:scale-110 transition-transform z-10 border-2 border-[#0a1628]"
            >
              <Camera size={20} />
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mt-4">{user.name}</h1>

        {/* Call to action for avatar if default */}
        {isCurrentUser && user.avatar_url?.includes('dicebear') && (
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="mt-2 text-[#4ECDC4] text-xs font-bold flex items-center gap-1 hover:underline"
          >
            <Sparkles size={12} />
            ¡Crea tu avatar con IA!
          </button>
        )}

        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          <div className="bg-white/10 text-white/80 px-4 py-1 rounded-full text-xs font-bold border border-white/20">
            {isCurrentUser ? 'Eres tú 😎' : 'Miembro BestieSocial 🌟'}
          </div>
          {user.is_admin && (
            <div className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">
              <Shield size={12} />
              Admin
            </div>
          )}
          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <Sparkles size={12} />
            {user.xp || 0} XP
          </div>
        </div>

        {/* Admin Panel Button - only for admin users on their own profile */}
        {isCurrentUser && isAdmin && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
          >
            <UserPlus size={18} />
            Gestionar Usuarios
          </button>
        )}

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
          <button
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="aspect-square relative bg-gray-800 rounded-md overflow-hidden group w-full text-left"
          >
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
          </button>
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
          <div className="w-full max-w-lg bg-gradient-to-br from-[#1a0533] to-[#0a1628] rounded-t-3xl p-6 pb-10 border-t border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Elige tu avatar</h2>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCamera(true)}
                  className="py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
                >
                  <Camera size={20} />
                  Tomar Foto
                </button>

                <label className="py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer">
                  <Upload size={20} />
                  Subir Foto
                  <input
                    type="file"
                    ref={selfieInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
              {aiError && (
                <p className="text-red-400 text-xs text-center mt-2 bg-red-900/20 py-2 rounded-lg border border-red-500/20">{aiError}</p>
              )}
            </div>

            {/* Avatar Catalog by Style */}
            <h3 className="text-sm font-bold text-white/50 mb-3 uppercase tracking-wide">O elige un avatar</h3>

            {avatarStyles.map((styleGroup, styleIndex) => (
              <div key={styleIndex} className="mb-6">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  {styleGroup.name}
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {styleGroup.seeds.map((seed, seedIndex) => {
                    const bg = styleGroup.bgs[seedIndex % styleGroup.bgs.length];
                    return (
                      <button
                        key={`${styleGroup.style}-${seed}`}
                        onClick={() => handleStyleAvatarSelect(styleGroup.style, seed, bg)}
                        disabled={isUpdating}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-[#4ECDC4] transition-all hover:scale-110 disabled:opacity-50 bg-gray-800"
                      >
                        <img
                          src={getAvatarUrlForStyle(styleGroup.style, seed, bg)}
                          alt={`${styleGroup.name} ${seed}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {isUpdating && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 rounded-t-3xl">
                <div className="text-center text-white">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                  <p className="font-bold">Guardando...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 bg-black/50 p-2 rounded-full"
          >
            <X size={24} />
          </button>

          <div className="relative w-full h-full max-w-lg flex items-center justify-center">
            {selectedPost.type === 'video' ? (
              <video
                src={selectedPost.url}
                className="max-w-full max-h-full rounded-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedPost.url}
                alt="Post"
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            )}

            {selectedPost.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl text-white">
                <p>{selectedPost.caption}</p>
                {selectedPost.stickers && selectedPost.stickers.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {selectedPost.stickers.map((s, i) => (
                      <span key={i} className="text-xl">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-[#1a0533] to-[#0a1628] rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-purple-400" />
                Panel de Admin
              </h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Create New User Section */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wide">Añadir Usuario</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del usuario..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#4ECDC4]"
                />
                <button
                  onClick={handleCreateUser}
                  disabled={!newUserName.trim() || isCreatingUser}
                  className="bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white px-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center min-w-[50px]"
                >
                  {isCreatingUser ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <UserPlus size={20} />
                  )}
                </button>
              </div>
              {createSuccess && (
                <div className="mt-2 text-green-400 text-sm flex items-center gap-1">
                  <Check size={16} />
                  ¡Usuario creado correctamente!
                </div>
              )}
            </div>

            {/* Current Members List */}
            <div>
              <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wide">
                Miembros ({members.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                    <img
                      src={member.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{member.name}</span>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>Lvl {member.level || 1}</span>
                        <span>•</span>
                        <span>{member.xp || 0} XP</span>
                      </div>
                    </div>
                    {member.is_admin && (
                      <div className="bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded-full">
                        Admin
                      </div>
                    )}
                    <button
                      onClick={() => handleEditClick(member)}
                      className="text-white/40 hover:text-[#4ECDC4] transition-colors p-2"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit User Modal Overlay */}
            {editingUser && (
              <div className="absolute inset-0 z-50 bg-[#0a1628] rounded-3xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
                  <button onClick={() => setEditingUser(null)} className="text-white/60 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase block mb-1">Contraseña</label>
                    <input
                      type="text"
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 font-bold uppercase block mb-1">Nivel</label>
                      <input
                        type="number"
                        value={editForm.level}
                        onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 font-bold uppercase block mb-1">XP</label>
                      <input
                        type="number"
                        value={editForm.xp}
                        onChange={(e) => setEditForm(prev => ({ ...prev, xp: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <input
                      type="checkbox"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#4ECDC4] focus:ring-[#4ECDC4]"
                    />
                    <label className="text-white font-medium">Es Administrador</label>
                  </div>

                  <button
                    onClick={handleUpdateUser}
                    className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white py-3 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-transform"
                  >
                    Guardar Cambios
                  </button>

                  {/* Delete button - only show if not editing yourself */}
                  {currentUser && editingUser && editingUser.id !== currentUser.id && (
                    <button
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      className="w-full bg-red-500/20 border border-red-500/50 text-red-400 py-3 rounded-xl font-bold mt-2 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Eliminar Usuario
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraView
          onClose={() => setShowCamera(false)}
          onCapture={handleCameraCapture}
          mode="avatar"
        />
      )}
    </div>
  );
};

export default UserProfile;