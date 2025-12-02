
import React, { useState } from 'react';
import { Background } from './components/Background';
import { Lobby } from './components/Lobby';
import { Profile } from './components/Profile';
import { SpinWheel } from './components/SpinWheel';
import { GameScreen } from './components/Game/GameScreen';
import { ViewState, User } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Mock User Data
const INITIAL_USER: User = {
  id: 'u1',
  name: 'CoolHomiie',
  avatarUrl: 'https://picsum.photos/seed/homiie1/200',
  coins: 1250,
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOBBY);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  
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

  return (
    <div className="relative w-full h-screen bg-ludo-dark text-white overflow-hidden font-sans selection:bg-ludo-red selection:text-white">
      {/* Background Layer - persistent across lobby/game but game board might obscure parts */}
      <Background />

      {/* Top Navigation / Status - Hide profile in Game to avoid clutter or show minimized */}
      <AnimatePresence>
        {view !== ViewState.GAME && (
          <Profile user={user} onOpenSpin={() => setIsSpinWheelOpen(true)} />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative w-full h-full flex flex-col">
        {view === ViewState.GAME ? (
          <GameScreen 
            onExit={() => setView(ViewState.LOBBY)} 
            vsComputer={gameMode === 'COMPUTER'}
          />
        ) : (
          <Lobby view={view} setView={handleSetView} />
        )}
      </main>

      {/* Overlays */}
      <SpinWheel 
        isOpen={isSpinWheelOpen} 
        onClose={() => setIsSpinWheelOpen(false)} 
        onReward={handleReward}
      />

      {/* Simple Footer / Version */}
      {view !== ViewState.GAME && (
        <div className="absolute bottom-4 left-6 text-white/20 font-mono text-xs z-10 pointer-events-none">
          v1.0.0 • BETA
        </div>
      )}
    </div>
  );
};

export default App;
