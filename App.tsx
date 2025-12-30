
import React, { useState } from 'react';
import { Background } from './components/Background';
import { Lobby } from './components/Lobby';
import { TopBar } from './components/TopBar';
import { SpinWheel } from './components/SpinWheel';
import { WalletPage } from './components/WalletPage';
import { GameScreen } from './components/Game/GameScreen';
import { ProfileOverlay } from './components/ProfileOverlay';
import { AuthPage } from './components/AuthPage';
import { ViewState, User } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Mock User Data
const INITIAL_USER: User = {
  id: 'u1',
  name: 'CoolHomiie',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoolHomiie',
  coins: 1250,
  level: 12,
  stats: {
    gamesWon: 154,
    gamesLost: 42,
    winStreak: 5,
    tokensCaptured: 892,
    tournamentsWon: 3
  }
};

const App: React.FC = () => {
  // Start with AUTH view
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Track previous view to determine game mode
  const [gameMode, setGameMode] = useState<'FRIEND' | 'COMPUTER'>('FRIEND');

  // Intercept view change to set mode
  const handleSetView = (newView: ViewState) => {
    if (newView === ViewState.PLAYING_COMPUTER) {
        setGameMode('COMPUTER');
    } else if (newView === ViewState.FRIEND_OPTIONS || newView === ViewState.CREATE_ROOM) {
        setGameMode('FRIEND');
    }
    setView(newView);
  };

  const handleReward = (amount: number) => {
    // Animation for coin update
    setUser(prev => ({ ...prev, coins: prev.coins + amount }));
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setView(ViewState.LOBBY);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setView(ViewState.AUTH);
  };

  return (
    <div className="relative w-full h-screen bg-ludo-dark text-white overflow-hidden font-sans selection:bg-ludo-red selection:text-white">
      {/* Background Layer */}
      <Background />

      {/* New Top Navigation */}
      <AnimatePresence>
        {view !== ViewState.GAME && view !== ViewState.WALLET && view !== ViewState.AUTH && (
          <TopBar 
            user={user} 
            onOpenWallet={() => setView(ViewState.WALLET)} 
            onOpenSettings={() => console.log('Settings')} 
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative w-full h-full flex flex-col">
        <AnimatePresence mode="wait">
          {view === ViewState.AUTH ? (
            <AuthPage key="auth" onLogin={handleLogin} />
          ) : view === ViewState.GAME ? (
            <GameScreen 
              key="game"
              onExit={() => setView(ViewState.LOBBY)} 
              vsComputer={gameMode === 'COMPUTER'}
            />
          ) : view === ViewState.WALLET ? (
            <WalletPage 
              key="wallet"
              user={user} 
              onClose={() => setView(ViewState.LOBBY)} 
              onOpenSpin={() => setIsSpinWheelOpen(true)}
            />
          ) : (
            <Lobby key="lobby" view={view} setView={handleSetView} />
          )}
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <SpinWheel 
        isOpen={isSpinWheelOpen} 
        onClose={() => setIsSpinWheelOpen(false)} 
        onReward={handleReward}
      />

      <ProfileOverlay 
        isOpen={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
        onEditProfile={() => {
          console.log('Editing profile...');
        }}
      />

      {/* Simple Footer / Version */}
      {view !== ViewState.GAME && view !== ViewState.WALLET && view !== ViewState.AUTH && (
        <div className="absolute bottom-4 left-6 text-white/20 font-mono text-xs z-10 pointer-events-none">
          v1.0.0 • BETA
        </div>
      )}
    </div>
  );
};

export default App;
