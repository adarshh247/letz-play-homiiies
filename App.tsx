
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
import { ControlRoom } from './components/ControlRoom';
import { EventPage } from './components/EventPage';
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

// Robust socket URL detection
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000' 
  : `${window.location.protocol}//${window.location.hostname}:3000`;

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [gameMode, setGameMode] = useState<'FRIEND' | 'COMPUTER'>('FRIEND');
  
  // Room & Socket State
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Function to initiate socket connection ONLY when needed
  const initiateSocket = useCallback(() => {
    if (socketRef.current?.connected) return;
    if (!user) return;

    setIsConnecting(true);
    
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket Established:', socket.id);
      setSocketConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('room_updated', (room: Room) => {
      setCurrentRoom(room);
      setView(ViewState.CREATE_ROOM);
    });

    socket.on('game_started', () => {
      setView(ViewState.GAME);
    });

    socket.on('error', (msg: string) => {
      alert(`Multiplayer Error: ${msg}`);
      setIsConnecting(false);
    });

    socket.on('connect_error', () => {
      console.warn('Could not connect to multiplayer server.');
      setSocketConnected(false);
      setIsConnecting(false);
    });
  }, [user]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auth & Profile Logic
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        fetchProfile(initialSession.user.id, initialSession.user.email);
      } else {
        setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id, newSession.user.email);
      } else {
        setUser(null);
        setView(ViewState.AUTH);
        setLoading(false);
        socketRef.current?.disconnect();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync user to DB whenever it changes (Debounced)
  useEffect(() => {
    if (!user || user.id.startsWith('guest_')) return;

    const timeoutId = setTimeout(async () => {
      try {
        const dbUpdates = {
          name: user.name,
          coins: user.coins,
          level: user.level,
          stats: user.stats,
          avatar_url: user.avatarUrl
        };
        
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);
        
        if (error) throw error;
        console.log('Profile auto-synced to DB:', user.coins);
      } catch (err) {
        console.error('Failed to auto-sync profile:', err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [user?.name, user?.coins, user?.level, JSON.stringify(user?.stats), user?.avatarUrl]);

  // Simplified fetchProfile - no client-side inserts!
  const fetchProfile = async (userId: string, email?: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // PGRST116 means "No rows returned". 
          // Since the DB trigger creates the profile, it might just need a millisecond.
          if (retryCount < 3) {
            console.log("Waiting for DB trigger to create profile...");
            setTimeout(() => fetchProfile(userId, email, retryCount + 1), 500);
            return;
          } else {
            console.error('Profile trigger failed to create user after 3 attempts.');
            // Fallback to guest or handle error state here
            setLoading(false);
          }
        } else {
          console.error('Error fetching profile:', error);
          setLoading(false);
        }
      } else if (data) {
        // Profile successfully fetched!
        setUser({
          id: data.id,
          name: data.name,
          email: email || '',
          avatarUrl: data.avatar_url,
          coins: Number(data.coins),
          level: data.level,
          stats: data.stats || DEFAULT_STATS,
          isAdmin: email === 'adarsh9394@gmail.com'
        });
        setView(prev => prev === ViewState.AUTH ? ViewState.LOBBY : prev);
        setLoading(false);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!user) return;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameMode('FRIEND');

    if (socketConnected && socketRef.current) {
      socketRef.current.emit('create_room', { user, roomCode });
    } else {
      // Fallback
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
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    if (!user || !roomCode) return;
    const cleanCode = roomCode.trim().toUpperCase();
    
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('join_room', { user, roomCode: cleanCode });
    } else {
      alert("Multiplayer server offline. Please try again later.");
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
    if (newView === ViewState.FRIEND_OPTIONS) {
      initiateSocket();
      setView(ViewState.FRIEND_OPTIONS);
    } else if (newView === ViewState.PLAYING_COMPUTER) {
      setGameMode('COMPUTER');
      setCurrentRoom(null);
      setView(ViewState.GAME);
    } else if (newView === ViewState.CREATE_ROOM) {
      handleCreateRoom();
    } else {
      setView(newView);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: `guest_${Math.random().toString(36).substring(2, 9)}`,
      name: `Guest ${Math.floor(Math.random() * 1000)}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      coins: 500,
      level: 1,
      stats: DEFAULT_STATS
    };
    setUser(guestUser);
    setView(ViewState.LOBBY);
  };

  const syncProfile = (updates: Partial<User> | ((prev: User | null) => Partial<User>)) => {
    setUser(prev => {
      const actualUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return prev ? { ...prev, ...actualUpdates } : null;
    });
  };

  const handleLogout = async () => {
    if (user && !user.id.startsWith('guest_')) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setView(ViewState.AUTH);
    setIsProfileOpen(false);
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
        {user && view !== ViewState.GAME && view !== ViewState.AUTH && view !== ViewState.CONTROL_ROOM && view !== ViewState.EVENT && (
          <TopBar 
            user={user} 
            onOpenWallet={() => setView(ViewState.WALLET)} 
            onOpenSettings={() => {
              // Standard settings logic could go here
              console.log("Settings clicked");
            }} 
            onOpenProfile={() => setIsProfileOpen(true)} 
            onOpenControlRoom={() => {
              // Grant admin status for this session when triggered via 3-click
              //if (!user.isAdmin) {
                syncProfile({ isAdmin: true });
              //}
              setView(ViewState.CONTROL_ROOM);
            }}
          />
        )}
      </AnimatePresence>

      <main className="relative w-full h-full flex flex-col z-10">
        <AnimatePresence mode="wait">
          {view === ViewState.AUTH ? (
            <AuthPage key="auth" onLogin={handleGuestLogin} />
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
          ) : view === ViewState.CONTROL_ROOM && user ? (
            <ControlRoom key="control_room" user={user} onClose={() => setView(ViewState.LOBBY)} />
          ) : view === ViewState.EVENT && user ? (
            <EventPage key="event" user={user} onClose={() => setView(ViewState.LOBBY)} />
          ) : (
            <Lobby 
              key="lobby" view={view} setView={handleSetView} onOpenDaily={() => setIsDailyRewardOpen(true)} 
              currentRoom={currentRoom} onJoinRoom={handleJoinRoom} onStartGame={handleStartGame}
              userId={user?.id} socketConnected={socketConnected} isConnecting={isConnecting}
              onSimulateRoom={() => handleCreateRoom()}
            />
          )}
        </AnimatePresence>
      </main>

      {user && (
        <>
          <SpinWheel isOpen={isSpinWheelOpen} onClose={() => setIsSpinWheelOpen(false)} 
            onReward={(amt) => syncProfile(prev => ({ coins: (prev?.coins || 0) + amt }))}
            onDeduct={(amt) => { 
              if (user.coins >= amt) { 
                syncProfile(prev => ({ coins: (prev?.coins || 0) - amt })); 
                return true; 
              } 
              return false; 
            }}
            userCoins={user.coins} />
          <DailyRewardOverlay isOpen={isDailyRewardOpen} onClose={() => setIsDailyRewardOpen(false)} onClaim={(amt) => syncProfile(prev => ({ coins: (prev?.coins || 0) + amt }))} />
          <ProfileOverlay isOpen={isProfileOpen} user={user} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout} onUpdateUser={syncProfile} />
        </>
      )}
    </div>
  );
};

export default App;
