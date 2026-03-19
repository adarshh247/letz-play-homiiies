
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

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: authData } = await supabase.auth.getUser();
        const fullName = authData.user?.user_metadata?.full_name || email?.split('@')[0] || 'Player';
        
        const newProfile = {
          id: userId,
          name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 500,
          level: 1,
          stats: DEFAULT_STATS,
          is_admin: email === 'adarsh9394@gmail.com'
        };
        
        const { data: createdData, error: createError } = await supabase.from('profiles').insert(newProfile).select().single();
        
        if (createdData) {
          setUser({
            id: createdData.id,
            name: createdData.name,
            avatarUrl: createdData.avatar_url,
            coins: createdData.coins,
            level: createdData.level,
            stats: createdData.stats || DEFAULT_STATS,
            isAdmin: createdData.is_admin
          });
          setView(prev => prev === ViewState.AUTH ? ViewState.LOBBY : prev);
        } else if (createError) {
          console.error('Error creating profile:', createError);
        }
      } else if (data) {
        const shouldBeAdmin = email === 'adarsh9394@gmail.com';
        if (shouldBeAdmin && !data.is_admin) {
          // Force admin status in DB for this email
          await supabase.from('profiles').update({ is_admin: true }).eq('id', userId);
          data.is_admin = true;
        }

        setUser({
          id: data.id,
          name: data.name,
          avatarUrl: data.avatar_url,
          coins: data.coins,
          level: data.level,
          stats: data.stats || DEFAULT_STATS,
          isAdmin: data.is_admin
        });
        setView(prev => prev === ViewState.AUTH ? ViewState.LOBBY : prev);
      } else if (error) {
        console.error('Error fetching profile:', error);
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

  const syncProfile = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
    if (user && !user.id.startsWith('guest_')) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.stats !== undefined) dbUpdates.stats = updates.stats;
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      
      supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    }
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
            onOpenSettings={() => {}} 
            onOpenProfile={() => setIsProfileOpen(true)} 
            onOpenControlRoom={() => {
              syncProfile({ isAdmin: true });
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
          ) : view === ViewState.CONTROL_ROOM && user?.isAdmin ? (
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
            onReward={(amt) => syncProfile({ coins: user.coins + amt })}
            onDeduct={(amt) => { if (user.coins >= amt) { syncProfile({ coins: user.coins - amt }); return true; } return false; }}
            userCoins={user.coins} />
          <DailyRewardOverlay isOpen={isDailyRewardOpen} onClose={() => setIsDailyRewardOpen(false)} onClaim={(amt) => syncProfile({ coins: user.coins + amt })} />
          <ProfileOverlay isOpen={isProfileOpen} user={user} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout} onUpdateUser={syncProfile} />
        </>
      )}
    </div>
  );
};

export default App;
