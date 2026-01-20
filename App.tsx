import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import FeedView from './components/FeedView';
import ChatView from './components/ChatView';
import CameraView from './components/CameraView';
import GamificationView from './components/GamificationView';
import AgendaView from './components/AgendaView';
import UserProfile from './components/UserProfile';
import { AppTab } from './types';
import { Home, MessageCircle, Camera, User as UserIcon, LogOut, Trophy, Loader2, Calendar, X, Sparkles } from 'lucide-react';

// Trophy color based on level
const getTrophyColor = (level: number) => {
  if (level >= 10) return '#B9F2FF'; // Diamond
  if (level >= 6) return '#E5E4E2'; // Platinum
  if (level >= 4) return '#FFD700'; // Gold
  if (level >= 2) return '#C0C0C0'; // Silver
  return '#CD7F32'; // Bronze
};

const getLevelName = (level: number) => {
  if (level >= 10) return 'Diamante 💎';
  if (level >= 6) return 'Platino ⚪';
  if (level >= 4) return 'Oro 🥇';
  if (level >= 2) return 'Plata 🥈';
  return 'Bronce 🥉';
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser, members, posts, logout } = useStore();

  const [hasSeenLanding, setHasSeenLanding] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [showCamera, setShowCamera] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showXPModal, setShowXPModal] = useState(false);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Cargando BestieSocial...</p>
        </div>
      </div>
    );
  }

  // Show landing page first
  if (!hasSeenLanding) {
    return <LandingPage onEnter={() => setHasSeenLanding(true)} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => { }} />;
  }

  const handleUserClick = (userId: string) => {
    setViewingUserId(userId);
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setViewingUserId(null);
  };

  const handleLogout = () => {
    logout();
    setHasSeenLanding(false);
  };

  const currentLevel = currentUser?.level || 1;
  const currentXP = currentUser?.xp || 0;
  const trophyColor = getTrophyColor(currentLevel);


  const renderContent = () => {
    // If viewing a specific user profile
    if (viewingUserId) {
      const user = members.find(m => m.id === viewingUserId);
      if (user) {
        return (
          <UserProfile
            user={user}
            posts={posts}
            isCurrentUser={user.id === currentUser?.id}
            onBack={() => setViewingUserId(null)}
          />
        );
      }
    }

    switch (activeTab) {
      case AppTab.HOME:
        return <FeedView posts={posts} onUserClick={handleUserClick} />;
      case AppTab.CHAT:
        return <ChatView />;
      case AppTab.MISSIONS:
        return <GamificationView />;
      case AppTab.AGENDA:
        return <AgendaView />;
      case AppTab.PROFILE:
        return currentUser ? (
          <UserProfile
            user={currentUser}
            posts={posts}
            isCurrentUser={true}
            onBack={undefined}
          />
        ) : null;
      default:
        return <FeedView posts={posts} onUserClick={handleUserClick} />;
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden font-sans relative">
      {/* Top Header (Sticky) */}
      {(!viewingUserId || activeTab === AppTab.PROFILE) && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#1a0533]/90 to-[#0a1628]/90 backdrop-blur-md z-30 flex items-center justify-between px-6 border-b border-white/10">
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Pacifico', cursive",
              background: 'linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #45B7D1, #FF6B9D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            BestieSocial
          </h1>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-xs font-black text-white uppercase tracking-tight">
                  {currentUser.name}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowXPModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: trophyColor }}
            >
              <Trophy size={20} className="text-white drop-shadow-sm" />
            </button>
          </div>
        </header>
      )}

      {/* XP Modal */}
      {showXPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowXPModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Tu Nivel</h3>
              <button onClick={() => setShowXPModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: trophyColor }}
              >
                <span className="text-3xl">🏆</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Nivel {currentLevel}</h2>
                <p className="text-sm font-medium" style={{ color: trophyColor }}>{getLevelName(currentLevel)}</p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Sparkles size={14} className="text-indigo-500" />
                  XP Total
                </span>
                <span className="font-black text-indigo-600">{currentXP}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentXP % 1000) / 1000) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentXP % 1000} / 1000 XP para nivel {currentLevel + 1}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 p-3 rounded-xl text-center">
                <p className="font-bold text-green-700">+100 XP</p>
                <p className="text-green-600">Abrir app</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl text-center">
                <p className="font-bold text-indigo-700">+300 XP</p>
                <p className="text-indigo-600">Crear post</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="h-full w-full overflow-auto">
        {renderContent()}
      </main>

      {/* Full Screen Camera Overlay */}
      {showCamera && (
        <CameraView
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 pb-4 z-40 flex justify-around items-center px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">

        {/* Button 1: Exit to Landing Page */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={26} />
        </button>

        {/* Button 2: Go to Feed */}
        <NavButton
          active={activeTab === AppTab.HOME && !viewingUserId}
          onClick={() => handleTabChange(AppTab.HOME)}
          icon={<Home size={26} />}
        />

        {/* Button 3: Floating Camera (Center) */}
        <div className="relative -top-6">
          <button
            onClick={() => setShowCamera(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center transform active:scale-95 transition-transform"
          >
            <Camera size={32} />
          </button>
        </div>

        {/* Button 4: Chat */}
        <NavButton
          active={activeTab === AppTab.CHAT}
          onClick={() => handleTabChange(AppTab.CHAT)}
          icon={<MessageCircle size={26} />}
        />

        {/* Button: Agenda */}
        <NavButton
          active={activeTab === AppTab.AGENDA}
          onClick={() => handleTabChange(AppTab.AGENDA)}
          icon={<Calendar size={26} />}
        />

        {/* Button 5: Profile */}
        <NavButton
          active={activeTab === AppTab.PROFILE}
          onClick={() => handleTabChange(AppTab.PROFILE)}
          icon={<UserIcon size={26} />}
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {icon}
  </button>
);

// Wrap with StoreProvider
const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;