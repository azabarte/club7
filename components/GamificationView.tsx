import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { CheckCircle, Lock, Loader2, Sparkles, Users, ChevronDown } from 'lucide-react';

const GamificationView: React.FC = () => {
  const { currentUser, missions, missionProgress, completeMissionAction, members, isLoading } = useStore();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const isMissionCompleted = (missionId: string, userId?: string) => {
    const targetUserId = userId || currentUser?.id;
    return missionProgress.some(p => p.mission_id === missionId && p.user_id === targetUserId && p.completed);
  };

  // Admin can mark mission as complete for any user
  const handleAdminCompleteMission = async () => {
    if (!currentUser?.is_admin || !selectedMission || !selectedUser) return;

    await completeMissionAction(selectedMission, selectedUser);
    setSelectedMission(null);
    setSelectedUser(null);
    alert('¡Misión completada con éxito!');
  };

  const completedCount = missions.filter(m => isMissionCompleted(m.id)).length;
  const xpProgress = currentUser ? (currentUser.xp % 200) : 0;
  const xpForNextLevel = 200;

  const allStickers = ['🔥', '🚀', '🌈', '🐶', '🍕', '🎮', '🦄', '⭐', '🐳', '🎭', '🌅', '🗺️', '💎'];
  const unlockedStickers = currentUser?.stickers_unlocked || [];

  // Non-admin members for selection
  const selectableMembers = members.filter(m => !m.is_admin);

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

      {/* Admin: Complete mission for user */}
      {currentUser?.is_admin && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} />
            <h3 className="font-bold">Completar Misión (Admin)</h3>
          </div>
          <p className="text-sm opacity-80 mb-3">Selecciona un usuario y una misión para marcarla como completada</p>

          <div className="space-y-2 mb-3">
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 border-0 outline-none"
            >
              <option value="" className="text-gray-800">Selecciona usuario...</option>
              {selectableMembers.map(m => (
                <option key={m.id} value={m.id} className="text-gray-800">{m.name}</option>
              ))}
            </select>

            <select
              value={selectedMission || ''}
              onChange={(e) => setSelectedMission(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 border-0 outline-none"
            >
              <option value="" className="text-gray-800">Selecciona misión...</option>
              {missions.map(m => (
                <option key={m.id} value={m.id} className="text-gray-800">{m.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAdminCompleteMission}
            disabled={!selectedMission || !selectedUser}
            className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl disabled:opacity-50"
          >
            ✓ Marcar como Completada
          </button>
        </div>
      )}

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
                <div
                  key={mission.id}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-100 shadow-sm'
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
                      {!currentUser?.is_admin && !completed && (
                        <span className="text-xs text-gray-400">Solo el admin puede completar</span>
                      )}
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
                </div>
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
          El admin completará tus misiones cuando las cumplas
        </p>
      </div>
    </div>
  );
};

export default GamificationView;