
import React, { useState, useEffect, useCallback } from 'react';
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

const DEFAULT_STATS: UserStats = {
  gamesWon: 0,
  gamesLost: 0,
  winStreak: 0,
  tokensCaptured: 0,
  tournamentsWon: 0
};

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

  // Listen for auth changes - ONLY ONCE ON MOUNT
  useEffect(() => {
    const initAuth = async () => {
      // Initial session check
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      if (initialSession) {
        setView(currentView => currentView === ViewState.AUTH ? ViewState.LOBBY : currentView);
        fetchProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Real-time listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setView(currentView => currentView === ViewState.AUTH ? ViewState.LOBBY : currentView);
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const signupName = authUser?.user_metadata?.full_name || 'Homiie';

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && (error.code === 'PGRST116' || error.message.includes('not found'))) {
        const newProfile = {
          id: userId,
          name: signupName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 1000,
          level: 1,
          stats: DEFAULT_STATS
        };
        await supabase.from('profiles').insert([newProfile]);
        
        setUser({
          id: userId,
          name: newProfile.name,
          avatarUrl: newProfile.avatar_url,
          coins: newProfile.coins,
          level: newProfile.level,
          stats: newProfile.stats
        });
      } else if (data) {
        setUser({
          id: data.id,
          name: data.name,
          avatarUrl: data.avatar_url,
          coins: data.coins,
          level: data.level,
          stats: data.stats || DEFAULT_STATS
        });
      } else {
        setUser({
          id: userId,
          name: signupName,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 1000,
          level: 1,
          stats: DEFAULT_STATS
        });
      }
    } catch (err) {
      console.error('Error in profile fetch:', err);
      if (!user) {
        setUser({
          id: userId,
          name: 'Guest Homiie',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 1000,
          level: 1,
          stats: DEFAULT_STATS
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to sync updates to DB without relying on local state closure
   */
  const syncToDB = async (userId: string, updates: any) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.stats !== undefined) dbUpdates.stats = updates.stats;
      await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    } catch (e) {
      console.warn('DB Sync failure:', e);
    }
  };

  const syncProfile = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      syncToDB(prev.id, updates);
      return updated;
    });
  };

  const handleReward = useCallback((amount: number) => {
    setUser(prev => {
      if (!prev) return prev;
      const newCoins = prev.coins + amount;
      syncToDB(prev.id, { coins: newCoins });
      return { ...prev, coins: newCoins };
    });
  }, []);

  const handleDeduct = useCallback((amount: number): boolean => {
    let success = false;
    setUser(prev => {
      if (!prev || prev.coins < amount) {
        success = false;
        return prev;
      }
      success = true;
      const newCoins = prev.coins - amount;
      syncToDB(prev.id, { coins: newCoins });
      return { ...prev, coins: newCoins };
    });
    return success;
  }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!user) return;
    const code = generateRoomCode();
    const newRoom: Room = {
      code,
      hostId: user.id,
      participants: [
        { id: user.id, name: user.name, avatarUrl: user.avatarUrl, isHost: true, isReady: true }
      ]
    };
    setCurrentRoom(newRoom);
    setView(ViewState.CREATE_ROOM);
    setGameMode('FRIEND');
  };

  const handleJoinRoom = (code: string) => {
    if (!user) return;
    // Real logic would check DB. For now, simulate.
    const mockHostId = 'host-123';
    const joinedRoom: Room = {
      code,
      hostId: mockHostId,
      participants: [
        { id: mockHostId, name: 'Room Host', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host', isHost: true, isReady: true },
        { id: user.id, name: user.name, avatarUrl: user.avatarUrl, isHost: false, isReady: true }
      ]
    };
    setCurrentRoom(joinedRoom);
    setView(ViewState.CREATE_ROOM);
    setGameMode('FRIEND');
  };

  const handleSimulateJoins = () => {
    if (!currentRoom) return;
    const mockNames = ['Zoe', 'Alex', 'Riley'];
    const newParticipants = [...currentRoom.participants];
    
    if (newParticipants.length < 4) {
      const idx = newParticipants.length;
      newParticipants.push({
        id: `guest-${idx}`,
        name: mockNames[idx - 1] || `Player ${idx + 1}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockNames[idx-1]}`,
        isHost: false,
        isReady: true
      });
      setCurrentRoom({ ...currentRoom, participants: newParticipants });
    }
  };

  const handleSetView = (newView: ViewState) => {
    if (newView === ViewState.PLAYING_COMPUTER) {
      setGameMode('COMPUTER');
      setCurrentRoom(null);
    } else if (newView === ViewState.FRIEND_OPTIONS) {
      setGameMode('FRIEND');
    } else if (newView === ViewState.CREATE_ROOM) {
      handleCreateRoom();
      return;
    }
    setView(newView);
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    setUser(null);
    setView(ViewState.AUTH);
    setLoading(false);
  };

  if (loading && !session) {
    return (
      <div className="fixed inset-0 bg-ludo-dark flex items-center justify-center z-[200]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
          className="w-12 h-12 border-4 border-ludo-red border-t-transparent rounded-full shadow-[0_0_20px_rgba(255,71,87,0.3)]" 
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-ludo-dark text-white overflow-hidden font-sans selection:bg-ludo-red selection:text-white">
      <Background />

      <AnimatePresence>
        {user && view !== ViewState.GAME && view !== ViewState.WALLET && view !== ViewState.AUTH && view !== ViewState.TOURNAMENT && (
          <TopBar 
            user={user} 
            onOpenWallet={() => setView(ViewState.WALLET)} 
            onOpenSettings={() => console.log('Settings')} 
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}
      </AnimatePresence>

      <main className="relative w-full h-full flex flex-col z-10">
        <AnimatePresence mode="wait">
          {view === ViewState.AUTH ? (
            <AuthPage key="auth" onLogin={() => {}} />
          ) : view === ViewState.GAME && user ? (
            <GameScreen 
              key="game"
              user={user}
              onExit={() => { setView(ViewState.LOBBY); setCurrentRoom(null); }} 
              vsComputer={gameMode === 'COMPUTER'}
              participants={currentRoom?.participants}
            />
          ) : view === ViewState.WALLET && user ? (
            <WalletPage 
              key="wallet"
              user={user} 
              onClose={() => setView(ViewState.LOBBY)} 
              onOpenSpin={() => setIsSpinWheelOpen(true)}
            />
          ) : view === ViewState.TOURNAMENT && user ? (
            <TournamentPage 
              key="tournament"
              user={user}
              onClose={() => setView(ViewState.LOBBY)}
            />
          ) : (
            <Lobby 
              key="lobby" 
              view={view} 
              setView={handleSetView} 
              onOpenDaily={() => setIsDailyRewardOpen(true)} 
              currentRoom={currentRoom}
              onJoinRoom={handleJoinRoom}
              onSimulateJoins={handleSimulateJoins}
              userId={user?.id}
            />
          )}
        </AnimatePresence>
      </main>

      {user && (
        <>
          <SpinWheel 
            isOpen={isSpinWheelOpen} 
            onClose={() => setIsSpinWheelOpen(false)} 
            onReward={handleReward}
            onDeduct={handleDeduct}
            userCoins={user.coins}
          />
          <DailyRewardOverlay
            isOpen={isDailyRewardOpen}
            onClose={() => setIsDailyRewardOpen(false)}
            onClaim={handleReward}
          />
          <ProfileOverlay 
            isOpen={isProfileOpen}
            user={user}
            onClose={() => setIsProfileOpen(false)}
            onLogout={handleLogout}
            onUpdateUser={syncProfile}
          />
        </>
      )}

      {view !== ViewState.GAME && view !== ViewState.WALLET && view !== ViewState.AUTH && (
        <div className="absolute bottom-4 left-6 text-white/20 font-mono text-[10px] z-10 pointer-events-none uppercase tracking-[0.2em]">
          Homiies Engine v1.0.0
        </div>
      )}
    </div>
  );
};

export default App;
