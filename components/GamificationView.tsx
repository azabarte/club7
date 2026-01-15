import React from 'react';
import { useStore } from '../lib/store';
import { CheckCircle, Lock, Loader2, Sparkles } from 'lucide-react';

const GamificationView: React.FC = () => {
  const { currentUser, missions, missionProgress, completeMissionAction, isLoading } = useStore();

  const isMissionCompleted = (missionId: string) => {
    return missionProgress.some(p => p.mission_id === missionId && p.completed);
  };

  const handleCompleteMission = async (missionId: string) => {
    if (isMissionCompleted(missionId)) return;
    await completeMissionAction(missionId);
  };

  const completedCount = missions.filter(m => isMissionCompleted(m.id)).length;
  const xpProgress = currentUser ? (currentUser.xp % 200) : 0; // XP within current level
  const xpForNextLevel = 200;

  // Available stickers (can be unlocked)
  const allStickers = ['🔥', '🚀', '🌈', '🐶', '🍕', '🎮', '🦄', '⭐', '🐳', '🎭', '🌅', '🗺️', '💎'];
  const unlockedStickers = currentUser?.stickers_unlocked || [];

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
          <div className="w-16 h-16 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center">
            <span className="text-3xl">🏆</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nivel {currentUser?.level || 1}</h2>
            <p className="opacity-80 flex items-center gap-1">
              <Sparkles size={14} />
              {currentUser?.xp || 0} XP total
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

      {/* Daily Missions */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-bold text-gray-800">Misiones de Hoy 📅</h3>
          <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">
            {completedCount}/{missions.length}
          </span>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-gray-500">No hay misiones activas hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map(mission => {
              const completed = isMissionCompleted(mission.id);
              return (
                <button
                  key={mission.id}
                  onClick={() => handleCompleteMission(mission.id)}
                  disabled={completed}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md active:scale-[0.98]'
                    }`}
                >
                  <div className="text-4xl">{mission.icon}</div>
                  <div className="flex-1">
                    <h4 className={`font-bold ${completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                      {mission.title}
                    </h4>
                    <p className="text-sm text-gray-500">{mission.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                        +{mission.xp_reward} XP
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    {completed ? (
                      <CheckCircle className="text-green-500 w-8 h-8" />
                    ) : (
                      <div className="bg-gray-100 rounded-xl px-3 py-1">
                        <span className="text-xs text-gray-400 block">Premio</span>
                        <span className="text-xl">{mission.reward_sticker}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
        <p className="text-center text-gray-400 text-sm mt-4">
          Completa misiones para desbloquear más stickers
        </p>
      </div>
    </div>
  );
};

export default GamificationView;