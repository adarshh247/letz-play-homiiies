
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, ArrowLeft, Plus, LogIn, Trophy, Play, Gift, Shield, Loader2, WifiOff } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { ViewState, Room } from '../types';

interface LobbyProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  onOpenDaily?: () => void;
  currentRoom: Room | null;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  userId?: string;
  socketConnected?: boolean;
  onSimulateRoom?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ 
  view, 
  setView, 
  onOpenDaily, 
  currentRoom, 
  onJoinRoom, 
  onStartGame,
  userId,
  socketConnected,
  onSimulateRoom
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);

  useEffect(() => {
    let timer: any;
    if (view === ViewState.CREATE_ROOM && !currentRoom) {
      timer = setTimeout(() => {
        setShowTimeoutFallback(true);
      }, 8000);
    } else {
      setShowTimeoutFallback(false);
    }
    return () => clearTimeout(timer);
  }, [view, currentRoom]);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const isHost = currentRoom?.hostId === userId;
  const participantCount = currentRoom?.participants.length || 0;
  // Requirement: exactly 4 players must be joined to click the button in multiplayer
  const canStart = participantCount === 4;

  return (
    <div className="relative z-10 flex flex-col items-center justify-start md:justify-center h-full w-full px-6 py-12 overflow-y-auto pointer-events-auto">
      <div className="mb-8 md:mb-12 text-center mt-20 md:mt-0">
        <AnimatePresence mode="wait">
          <motion.h1 
            key={view} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-[-0.05em] italic"
          >
            {view === ViewState.CREATE_ROOM ? "Match Lobby" : "Play Homiies"}
          </motion.h1>
        </AnimatePresence>
        <div className="h-1 w-10 bg-ludo-red mx-auto mt-2" />
      </div>

      <div className="w-full max-w-sm pb-12">
        <AnimatePresence mode="wait">
          {view === ViewState.LOBBY && (
            <motion.div key="main" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
              <SharpButton onClick={() => setView(ViewState.FRIEND_OPTIONS)} icon={<Users size={18} />}>Multiplayer</SharpButton>
              <SharpButton onClick={() => setView(ViewState.TOURNAMENT)} variant="accent" icon={<Trophy size={18} />}>Tournaments</SharpButton>
              <SharpButton onClick={() => setView(ViewState.PLAYING_COMPUTER)} variant="outline" icon={<Bot size={18} />}>Solo vs AI</SharpButton>
              <SharpButton onClick={onOpenDaily} variant="ghost" icon={<Gift size={16} />}>Daily Rewards</SharpButton>
            </motion.div>
          )}

          {view === ViewState.FRIEND_OPTIONS && (
            <motion.div key="friend" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
              <SharpButton variant="accent" icon={<Plus size={18} />} onClick={() => setView(ViewState.CREATE_ROOM)}>Create Room</SharpButton>
              <SharpButton variant="outline" icon={<LogIn size={18} />} onClick={() => setView(ViewState.JOIN_ROOM)}>Join with Code</SharpButton>
              <button onClick={() => setView(ViewState.LOBBY)} className="mt-4 text-white/20 uppercase font-black text-[9px] flex items-center justify-center gap-2 transition-colors hover:text-white"><ArrowLeft size={12} /> Return</button>
            </motion.div>
          )}

          {view === ViewState.CREATE_ROOM && (
            <motion.div key="room" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4 bg-black/40 p-5 border border-white/10">
               {currentRoom ? (
                 <>
                  <div className="text-center py-2 border-b border-white/5">
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1 block">Room Protocol Code</span>
                      <div className="text-2xl font-black text-ludo-red tracking-[0.3em] font-mono select-all cursor-copy" title="Click to copy">{currentRoom.code}</div>
                  </div>
                  
                  <div className="py-2 space-y-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const participant = currentRoom.participants[idx];
                      return (
                        <div key={idx} className={`flex items-center justify-between p-2 border ${participant ? 'border-white/10 bg-white/5' : 'border-dashed border-white/5 opacity-40'}`}>
                            <div className="flex items-center gap-3">
                              {participant ? (
                                <>
                                  <div className="w-8 h-8 border border-white/10 bg-white/5 overflow-hidden">
                                    <img src={participant.avatarUrl} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase">{participant.name}</span>
                                    {participant.isHost && <div className="text-ludo-yellow text-[7px] font-black uppercase flex items-center gap-1"><Shield size={8} /> Host</div>}
                                  </div>
                                </>
                              ) : (
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Open Slot...</span>
                              )}
                            </div>
                            {participant && <div className="text-[8px] font-black text-ludo-green uppercase">Ready</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                      {isHost ? (
                        <SharpButton 
                          variant={canStart ? "accent" : "outline"} 
                          disabled={!canStart} 
                          onClick={onStartGame} 
                          icon={<Play size={16} />}
                          className="h-14"
                        >
                          {canStart ? "LETS PLAY HOMIIES" : `Waiting for Homiies (${participantCount}/4)`}
                        </SharpButton>
                      ) : (
                        <div className="p-3 bg-white/5 text-center text-[9px] font-black text-white/40 uppercase tracking-[0.3em] animate-pulse">Awaiting Host...</div>
                      )}
                      <SharpButton variant="ghost" onClick={() => { setView(ViewState.FRIEND_OPTIONS); }}>Abandon Room</SharpButton>
                  </div>
                 </>
               ) : (
                 <div className="py-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                    {!showTimeoutFallback ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                          <Loader2 size={32} className="text-ludo-red" />
                        </motion.div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] text-center leading-relaxed">
                          Establishing Link<br/><span className="text-white/20">Awaiting Server Response</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <WifiOff size={24} className="text-ludo-red mb-2" />
                        <p className="text-[10px] font-black text-ludo-red uppercase tracking-[0.3em] text-center">Connection Timeout</p>
                        <SharpButton variant="primary" onClick={onSimulateRoom} className="w-full h-10 text-[9px] mt-4">Retry Protocol</SharpButton>
                        <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)} className="w-full h-10 text-[9px]">Cancel</SharpButton>
                      </>
                    )}
                 </div>
               )}
            </motion.div>
          )}

          {view === ViewState.JOIN_ROOM && (
            <motion.div key="join" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4 bg-white/5 p-5 border border-white/10">
               <div className="space-y-1">
                 <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Protocol Key</label>
                 <input 
                  type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="HM-XXXX" maxLength={6} className="w-full bg-black/40 border border-white/10 p-4 text-xl font-black text-white outline-none focus:border-ludo-red text-center tracking-[0.3em] font-mono"
                 />
               </div>
               <SharpButton variant="primary" onClick={() => onJoinRoom(joinCodeInput)} disabled={joinCodeInput.length < 1}>JOIN</SharpButton>
               <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)}>Back</SharpButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
