
import React, { useState, useEffect } from 'react';
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
import { ViewState, User, UserStats } from './types';
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

  // Listen for auth changes - ONLY ONCE ON MOUNT
  useEffect(() => {
    const initAuth = async () => {
      // Initial session check
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      if (initialSession) {
        // Use functional update to check current view without depending on it
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
        // Only redirect to LOBBY if we are currently at the AUTH page
        setView(currentView => currentView === ViewState.AUTH ? ViewState.LOBBY : currentView);
        fetchProfile(newSession.user.id);
      } else {
        setUser(null);
        setView(ViewState.AUTH);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Dependency array is empty to prevent re-running on view changes

  const fetchProfile = async (userId: string) => {
    try {
      // Get auth metadata to check for signup name
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const signupName = authUser?.user_metadata?.full_name || 'Homiie';

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && (error.code === 'PGRST116' || error.message.includes('not found'))) {
        // Profile doesn't exist, create it with the signup name
        const newProfile = {
          id: userId,
          name: signupName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 1000,
          level: 1,
          stats: DEFAULT_STATS
        };
        const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
        
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
        // Fallback for unexpected errors (like missing table)
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

  const syncProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    // Optimistic update
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.stats !== undefined) dbUpdates.stats = updates.stats;

      await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);
    } catch (e) {
      console.warn('Silent sync failure (DB probably not configured):', e);
    }
  };

  const handleSetView = (newView: ViewState) => {
    if (newView === ViewState.PLAYING_COMPUTER) setGameMode('COMPUTER');
    else if (newView === ViewState.FRIEND_OPTIONS || newView === ViewState.CREATE_ROOM) setGameMode('FRIEND');
    setView(newView);
  };

  const handleReward = (amount: number) => {
    if (user) syncProfile({ coins: user.coins + amount });
  };

  const handleDeduct = (amount: number): boolean => {
    if (!user || user.coins < amount) return false;
    syncProfile({ coins: user.coins - amount });
    return true;
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
              onExit={() => setView(ViewState.LOBBY)} 
              vsComputer={gameMode === 'COMPUTER'}
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
