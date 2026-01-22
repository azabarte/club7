import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
// Lazy load components for performance
const FeedView = React.lazy(() => import('./components/FeedView'));
const ChatView = React.lazy(() => import('./components/ChatView'));
const CameraView = React.lazy(() => import('./components/CameraView'));
const GamificationView = React.lazy(() => import('./components/GamificationView'));
const AgendaView = React.lazy(() => import('./components/AgendaView'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
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

  // Handle browser back button
  React.useEffect(() => {
    // Set initial state
    window.history.replaceState({ tab: AppTab.HOME, userId: null, camera: false }, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        setActiveTab(state.tab || AppTab.HOME);
        setViewingUserId(state.userId || null);
        setShowCamera(!!state.camera);
      } else {
        // Fallback for empty state (shouldn't happen with replaceState above, but strictly)
        setActiveTab(AppTab.HOME);
        setViewingUserId(null);
        setShowCamera(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    window.history.pushState({ tab: activeTab, userId, camera: false }, '');
    setViewingUserId(userId);
  };

  const handleTabChange = (tab: AppTab) => {
    window.history.pushState({ tab, userId: null, camera: false }, '');
    setActiveTab(tab);
    setViewingUserId(null);
    setShowCamera(false);
  };

  const openCamera = () => {
    window.history.pushState({ tab: activeTab, userId: viewingUserId, camera: true }, '');
    setShowCamera(true);
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
            onBack={() => window.history.back()}
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
            {/* Level Badge - Upgraded & Animated */}
            <div className="relative">
              <button
                onClick={() => setShowXPModal(true)}
                className="relative w-16 h-16 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  <img
                    src="/robotGif.gif"
                    alt="Besti"
                    className="w-full h-full object-cover scale-110 mix-blend-screen filter brightness-110 contrast-110"
                  />
                </div>

                {/* Giant Animated Level Medal */}
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce z-20"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FDB931, #F4A460)',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.6), inset 0 0 5px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <span className="text-sm font-black text-amber-900 leading-none drop-shadow-sm">
                    {currentLevel}
                  </span>
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent pointer-events-none" />
                </div>
              </button>
            </div>
          </div>
        </header>
      )
      }

      {/* XP Modal - Fun & Dynamic */}
      {
        showXPModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowXPModal(false)}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.3) 0%, rgba(0,0,0,0.8) 100%)'
            }}
          >
            {/* Floating particles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${12 + Math.random() * 20}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                >
                  {['✨', '⭐', '🌟', '💫', '🔥'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div
              className="relative bg-gradient-to-br from-white via-white to-indigo-50 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all animate-bounce"
              onClick={e => e.stopPropagation()}
              style={{
                animationDuration: '0.3s',
                animationIterationCount: '1',
                boxShadow: `0 0 40px ${trophyColor}60, 0 20px 60px rgba(0,0,0,0.3)`
              }}
            >
              {/* Decorative corner sparkles */}
              <div className="absolute -top-3 -left-3 text-2xl animate-spin" style={{ animationDuration: '3s' }}>✨</div>
              <div className="absolute -top-3 -right-3 text-2xl animate-spin" style={{ animationDuration: '4s' }}>🌟</div>
              <div className="absolute -bottom-3 -left-3 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>⭐</div>
              <div className="absolute -bottom-3 -right-3 text-2xl animate-pulse">💫</div>

              {/* Close button */}
              <button
                onClick={() => setShowXPModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
              >
                <X size={18} className="text-gray-400 group-hover:text-red-500" />
              </button>

              {/* Giant Besti Robot */}
              <div className="text-center mb-4">
                <div
                  className="inline-flex items-center justify-center w-40 h-40 mb-3 relative"
                  style={{
                    background: 'transparent',
                    boxShadow: 'none'
                  }}
                >
                  {/* Floating stars around Besti */}
                  <div className="absolute -top-2 left-1/2 text-xl animate-bounce" style={{ animationDuration: '1.5s' }}>⭐</div>
                  <div className="absolute top-1/4 -left-2 text-lg animate-ping" style={{ animationDuration: '2s' }}>✨</div>
                  <div className="absolute top-1/4 -right-2 text-lg animate-pulse">💫</div>
                  <div className="absolute -bottom-1 left-1/4 text-sm animate-bounce" style={{ animationDuration: '2s' }}>🌟</div>
                  <div className="absolute -bottom-1 right-1/4 text-sm animate-ping" style={{ animationDuration: '3s' }}>✨</div>

                  {/* Besti with fun animation */}
                  {/* Besti with fun animation */}
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
                    <img
                      src="/robotGif.gif"
                      alt="Besti"
                      className="w-full h-full object-cover scale-110"
                      style={{
                        mixBlendMode: 'screen',
                        filter: 'brightness(1.1) contrast(1.1)'
                      }}
                    />
                  </div>
                </div>
                <h2
                  className="text-4xl font-black bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${trophyColor}, #6366f1, #8b5cf6)`,
                    WebkitBackgroundClip: 'text'
                  }}
                >
                  Nivel {currentLevel}
                </h2>
                <p
                  className="text-lg font-bold mt-1"
                  style={{ color: trophyColor }}
                >
                  {getLevelName(currentLevel)}
                </p>
              </div>

              {/* XP Progress Card */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: `linear-gradient(135deg, ${trophyColor}15, ${trophyColor}05)`
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500 animate-pulse" />
                    Experiencia Total
                  </span>
                  <span
                    className="text-2xl font-black"
                    style={{ color: trophyColor }}
                  >
                    {currentXP.toLocaleString()}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                    style={{ animationDuration: '1.5s' }}
                  />
                  <div
                    className="relative h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${((currentXP % 1000) / 1000) * 100}%`,
                      background: `linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #d946ef)`
                    }}
                  >
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                      style={{ animationDuration: '2s' }}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                  <span>{currentXP % 1000} XP</span>
                  <span className="flex items-center gap-1">
                    🎯 {1000 - (currentXP % 1000)} para nivel {currentLevel + 1}
                  </span>
                </div>
              </div>

              {/* How to Earn - Fun Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-2xl text-white text-center transform hover:scale-105 transition-transform shadow-lg">
                  <div className="text-3xl mb-1">📱</div>
                  <p className="text-xl font-black">+100</p>
                  <p className="text-xs opacity-90">Abrir app</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white text-center transform hover:scale-105 transition-transform shadow-lg">
                  <div className="text-3xl mb-1">📸</div>
                  <p className="text-xl font-black">+300</p>
                  <p className="text-xs opacity-90">Crear post</p>
                </div>
              </div>

              {/* Fun tip */}
              <p className="text-center text-xs text-gray-400 mt-4 animate-pulse">
                ✨ ¡Sigue así para llegar a Diamante! ✨
              </p>
            </div>
          </div>
        )
      }

      {/* Main Content Area */}
      <main className="h-full w-full overflow-auto">
        <React.Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        }>
          {renderContent()}
        </React.Suspense>
      </main>

      {/* Full Screen Camera Overlay */}
      {
        showCamera && (
          <React.Suspense fallback={<div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><Loader2 className="text-white animate-spin" /></div>}>
            <CameraView
              onClose={() => window.history.back()}
            />
          </React.Suspense>
        )
      }

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
            onClick={openCamera}
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
    </div >
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