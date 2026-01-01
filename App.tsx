
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Background } from './components/Background';
import { Lobby } from './components/Lobby';
import { TopBar } from './components/TopBar';
import { SpinWheel } from './components/SpinWheel';
import { DailyRewardOverlay } from './components/DailyRewardOverlay';
import { WalletPage } from './components/WalletPage';
import { GameScreen } from './components/Game/GameScreen';
import { ProfileOverlay } from './components/ProfileOverlay';
import { AuthPage } from './components/AuthPage';
import { TournamentPage } from './components/TournamentPage';
import { ViewState, User, UserStats, Room, RoomParticipant } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { io, Socket } from 'socket.io-client';

const DEFAULT_STATS: UserStats = {
  gamesWon: 0,
  gamesLost: 0,
  winStreak: 0,
  tokensCaptured: 0,
  tournamentsWon: 0
};

// In many preview environments, the backend runs on the same host but different port
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : `https://${window.location.hostname.replace('3000', '')}:3000`;

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [gameMode, setGameMode] = useState<'FRIEND' | 'COMPUTER'>('FRIEND');
  
  // Room State
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Socket Connection Initialization
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 5000,
      transports: ['websocket', 'polling']
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to Homiies Server');
      setSocketConnected(true);
      // Re-sync if we were already in a room locally
      if (currentRoom && user) {
        socketRef.current?.emit('create_room', { user, roomCode: currentRoom.code });
      }
    });

    socketRef.current.on('disconnect', () => {
      setSocketConnected(false);
    });

    socketRef.current.on('room_updated', (room: Room) => {
      setCurrentRoom(room);
    });

    socketRef.current.on('game_started', () => {
      setView(ViewState.GAME);
    });

    socketRef.current.on('error', (msg: string) => {
      console.error('Socket Error:', msg);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]); // Re-init socket if user changes to ensure correct ID

  // Auth & Profile Logic
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        fetchProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id);
      } else {
        setUser(null);
        setView(ViewState.AUTH);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          avatarUrl: data.avatar_url,
          coins: data.coins,
          level: data.level,
          stats: data.stats || DEFAULT_STATS
        });
        setView(prev => prev === ViewState.AUTH ? ViewState.LOBBY : prev);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!user) return;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 1. Set state LOCALLY immediately for instant UI
    const localRoom: Room = {
      code: roomCode,
      hostId: user.id,
      participants: [{
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isHost: true,
        isReady: true
      }]
    };
    setCurrentRoom(localRoom);
    setView(ViewState.CREATE_ROOM);
    setGameMode('FRIEND');

    // 2. Notify server in background if connected
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('create_room', { user, roomCode });
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    if (!user) return;
    
    // For joining, we must try to connect to server first
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('join_room', { user, roomCode });
      setView(ViewState.CREATE_ROOM);
    } else {
      // Fallback for simulation/testing
      const simulatedRoom: Room = {
        code: roomCode,
        hostId: 'system',
        participants: [
          { id: 'system', name: 'Host Homiie', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host', isHost: true, isReady: true },
          { id: user.id, name: user.name, avatarUrl: user.avatarUrl, isHost: false, isReady: true }
        ]
      };
      setCurrentRoom(simulatedRoom);
      setView(ViewState.CREATE_ROOM);
    }
  };

  const handleStartGame = () => {
    if (socketConnected && socketRef.current && currentRoom) {
      socketRef.current.emit('start_game', currentRoom.code);
    } else {
      setView(ViewState.GAME);
    }
  };

  const handleSetView = (newView: ViewState) => {
    if (newView === ViewState.PLAYING_COMPUTER) {
      setGameMode('COMPUTER');
      setCurrentRoom(null);
      setView(ViewState.GAME);
    } else if (newView === ViewState.CREATE_ROOM) {
      handleCreateRoom();
    } else {
      setView(newView);
    }
  };

  const syncProfile = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
    // Silent background sync
    if (user) supabase.from('profiles').update(updates).eq('id', user.id);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-ludo-dark flex items-center justify-center z-[200]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
          className="w-10 h-10 border-2 border-ludo-red border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-ludo-dark text-white overflow-hidden font-sans">
      <Background />
      <AnimatePresence>
        {user && view !== ViewState.GAME && view !== ViewState.AUTH && (
          <TopBar user={user} onOpenWallet={() => setView(ViewState.WALLET)} onOpenSettings={() => {}} onOpenProfile={() => setIsProfileOpen(true)} />
        )}
      </AnimatePresence>

      <main className="relative w-full h-full flex flex-col z-10">
        <AnimatePresence mode="wait">
          {view === ViewState.AUTH ? (
            <AuthPage key="auth" onLogin={() => {}} />
          ) : view === ViewState.GAME && user ? (
            <GameScreen 
              key="game" user={user} 
              onExit={() => { setView(ViewState.LOBBY); setCurrentRoom(null); }} 
              vsComputer={gameMode === 'COMPUTER'}
              participants={currentRoom?.participants}
              roomCode={currentRoom?.code}
              socket={socketRef.current}
            />
          ) : view === ViewState.WALLET && user ? (
            <WalletPage key="wallet" user={user} onClose={() => setView(ViewState.LOBBY)} onOpenSpin={() => setIsSpinWheelOpen(true)} />
          ) : view === ViewState.TOURNAMENT && user ? (
            <TournamentPage key="tournament" user={user} onClose={() => setView(ViewState.LOBBY)} />
          ) : (
            <Lobby 
              key="lobby" view={view} setView={handleSetView} onOpenDaily={() => setIsDailyRewardOpen(true)} 
              currentRoom={currentRoom} onJoinRoom={handleJoinRoom} onStartGame={handleStartGame}
              userId={user?.id} socketConnected={socketConnected}
              onSimulateRoom={() => handleCreateRoom()}
            />
          )}
        </AnimatePresence>
      </main>

      {user && (
        <>
          <SpinWheel isOpen={isSpinWheelOpen} onClose={() => setIsSpinWheelOpen(false)} 
            onReward={(amt) => syncProfile({ coins: user.coins + amt })}
            onDeduct={(amt) => { if (user.coins >= amt) { syncProfile({ coins: user.coins - amt }); return true; } return false; }}
            userCoins={user.coins} />
          <DailyRewardOverlay isOpen={isDailyRewardOpen} onClose={() => setIsDailyRewardOpen(false)} onClaim={(amt) => syncProfile({ coins: user.coins + amt })} />
          <ProfileOverlay isOpen={isProfileOpen} user={user} onClose={() => setIsProfileOpen(false)} onLogout={() => supabase.auth.signOut()} onUpdateUser={syncProfile} />
        </>
      )}
    </div>
  );
};

export default App;
