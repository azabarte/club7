import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import FeedView from './components/FeedView';
import ChatView from './components/ChatView';
import CameraView from './components/CameraView';
import GamificationView from './components/GamificationView';
import UserProfile from './components/UserProfile';
import { AppTab } from './types';
import { Home, MessageCircle, Camera, User as UserIcon, LogOut, Trophy, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser, members, posts, logout } = useStore();

  const [hasSeenLanding, setHasSeenLanding] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [showCamera, setShowCamera] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Cargando Club7...</p>
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

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-2 mr-2">
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border-2 border-indigo-200"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {currentUser.name}
                </span>
              </div>
            )}
            <button
              onClick={() => handleTabChange(AppTab.MISSIONS)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === AppTab.MISSIONS ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <Trophy size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="h-full w-full overflow-hidden">
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