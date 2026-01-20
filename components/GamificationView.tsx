import React from 'react';
import { useStore } from '../lib/store';
import { Lock, Loader2, Sparkles, Camera, MessageCircle } from 'lucide-react';

const GamificationView: React.FC = () => {
  const { currentUser, isLoading } = useStore();

  const xpProgress = currentUser ? (currentUser.xp % 1000) : 0;
  const xpForNextLevel = 1000;
  const currentLevel = currentUser?.level || 1;
  const totalXP = currentUser?.xp || 0;

  const allStickers = ['🔥', '🚀', '🌈', '🐶', '🍕', '🎮', '🦄', '⭐', '🐳', '🎭', '🌅', '🗺️', '💎'];
  const unlockedStickers = currentUser?.stickers_unlocked || [];

  // Trophy color based on level
  const getTrophyColor = () => {
    if (currentLevel >= 10) return '#B9F2FF'; // Diamond
    if (currentLevel >= 6) return '#E5E4E2'; // Platinum
    if (currentLevel >= 4) return '#FFD700'; // Gold
    if (currentLevel >= 2) return '#C0C0C0'; // Silver
    return '#CD7F32'; // Bronze
  };

  const getLevelName = () => {
    if (currentLevel >= 10) return 'Diamante 💎';
    if (currentLevel >= 6) return 'Platino ⚪';
    if (currentLevel >= 4) return 'Oro 🥇';
    if (currentLevel >= 2) return 'Plata 🥈';
    return 'Bronce 🥉';
  };

  if (isLoading) {
    return (
      <div className="pb-24 pt-20 px-4 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-20 px-4 space-y-6 bg-gray-50 h-full overflow-y-auto">

      {/* Header Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center"
            style={{ backgroundColor: getTrophyColor() }}
          >
            <span className="text-3xl">🏆</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nivel {currentLevel}</h2>
            <p className="opacity-90 text-sm font-medium">{getLevelName()}</p>
            <p className="opacity-80 flex items-center gap-1 text-sm">
              <Sparkles size={14} />
              {totalXP} XP total
            </p>
          </div>
        </div>
        <div className="w-full bg-black/20 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(xpProgress / xpForNextLevel) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-bold opacity-70">
          <span>{xpProgress} XP</span>
          <span>{xpForNextLevel} XP para siguiente nivel</span>
        </div>
      </div>

      {/* How to Earn XP */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">¿Cómo ganar XP? ⚡</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-800">Abrir la app</p>
              <p className="text-xs text-green-600">Cada vez que entras</p>
            </div>
            <span className="text-green-600 font-black text-lg">+100 XP</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-indigo-800">Crear un post</p>
              <p className="text-xs text-indigo-600">Foto o video</p>
            </div>
            <span className="text-indigo-600 font-black text-lg">+300 XP</span>
          </div>
        </div>
        <p className="text-center text-gray-400 text-xs mt-4">
          1000 XP = 1 Nivel
        </p>
      </div>

      {/* Sticker Collection */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">
          Mis Stickers 🎨
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({unlockedStickers.length}/{allStickers.length})
          </span>
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {allStickers.map((sticker, idx) => {
            const unlocked = unlockedStickers.includes(sticker);
            return (
              <div
                key={idx}
                className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all ${unlocked
                  ? 'bg-white shadow-sm border border-gray-100 hover:scale-105'
                  : 'bg-gray-200 opacity-50'
                  }`}
              >
                {unlocked ? sticker : <Lock size={20} className="text-gray-400" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GamificationView;