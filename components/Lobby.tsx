
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, ArrowLeft, Plus, LogIn, Trophy, Play, Gift, ShieldAlert } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { ViewState } from '../types';

interface LobbyProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  onOpenDaily?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ view, setView, onOpenDaily }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      } 
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  const getTitle = () => {
    switch (view) {
      case ViewState.FRIEND_OPTIONS: return "Gather Friends";
      case ViewState.CREATE_ROOM: return "Host Match";
      case ViewState.JOIN_ROOM: return "Join Match";
      case ViewState.PLAYING_COMPUTER: return "Practice Mode";
      case ViewState.TOURNAMENT: return "Arena Protocol";
      default: return "Play Homiies";
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center min-h-screen w-full px-6 py-12 overflow-y-auto">
      {/* Super Minimal Header */}
      <div className="mb-8 md:mb-12 text-center flex-shrink-0 mt-16 md:mt-0">
        <AnimatePresence mode="wait">
          <motion.h1 
            key={view}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-[-0.05em] italic leading-tight"
          >
            {getTitle()}
          </motion.h1>
        </AnimatePresence>
        <div className="h-1 w-10 bg-ludo-red mx-auto mt-2" />
      </div>

      <div className="w-full max-w-sm flex-shrink-0">
        <AnimatePresence mode="wait">
          {/* COMPACT MAIN MENU */}
          {view === ViewState.LOBBY && (
            <motion.div 
              key="main-menu"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-3"
            >
              <motion.div variants={itemVariants}>
                <SharpButton 
                  onClick={() => setView(ViewState.FRIEND_OPTIONS)}
                  variant="primary"
                  className="w-full h-12 md:h-14"
                  icon={<Users size={18} />}
                >
                  Multiplayer
                </SharpButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <SharpButton 
                  onClick={() => setView(ViewState.TOURNAMENT)}
                  variant="accent"
                  className="w-full h-12 md:h-14"
                  icon={<Trophy size={18} />}
                >
                  Tournaments
                </SharpButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <SharpButton 
                  onClick={() => setView(ViewState.PLAYING_COMPUTER)}
                  variant="outline"
                  className="w-full h-12 md:h-14"
                  icon={<Bot size={18} />}
                >
                  Solo vs AI
                </SharpButton>
              </motion.div>

              <motion.div variants={itemVariants}>
                <SharpButton 
                  onClick={onOpenDaily}
                  variant="ghost"
                  className="w-full h-10 border border-white/5 hover:border-ludo-yellow hover:text-ludo-yellow"
                  icon={<Gift size={16} />}
                >
                  Daily Rewards
                </SharpButton>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="mt-4 flex items-center justify-center gap-6 py-3 border-t border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-ludo-green rounded-none" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">1.2k Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert size={10} className="text-ludo-yellow" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Season 01</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {view === ViewState.FRIEND_OPTIONS && (
            <motion.div 
              key="friend-options"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-3"
            >
              <SharpButton 
                variant="accent"
                className="w-full h-12 md:h-14"
                icon={<Plus size={18} />}
                onClick={() => setView(ViewState.CREATE_ROOM)}
              >
                Create Room
              </SharpButton>
              <SharpButton 
                variant="outline"
                className="w-full h-12 md:h-14"
                icon={<LogIn size={18} />}
                onClick={() => setView(ViewState.JOIN_ROOM)}
              >
                Join with Code
              </SharpButton>

              <button 
                onClick={() => setView(ViewState.LOBBY)} 
                className="mt-4 text-white/20 hover:text-white transition-colors uppercase font-black text-[9px] tracking-[0.4em] flex items-center justify-center gap-2 py-2"
              >
                <ArrowLeft size={12} /> Return
              </button>
            </motion.div>
          )}

          {view === ViewState.CREATE_ROOM && (
            <motion.div 
              key="create-room"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-4 bg-white/5 p-5 border border-white/10"
            >
               <div className="text-center py-2 md:py-4 border-b border-white/5">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1 block">Room Secret</span>
                  <div className="text-2xl md:text-3xl font-black text-ludo-red tracking-widest">HM-92X</div>
               </div>
               
               <div className="py-2 space-y-2">
                 <div className="flex justify-between items-center text-[10px] uppercase font-black text-ludo-green">
                    <span>You (Master)</span>
                    <span>Ready</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] uppercase font-black text-white/20 animate-pulse">
                    <span>Awaiting Friend...</span>
                 </div>
               </div>

               <div className="flex flex-col gap-2 pt-2">
                  <SharpButton variant="primary" onClick={() => setView(ViewState.GAME)} className="w-full h-12" icon={<Play size={16} />}>
                    Start Match
                  </SharpButton>
                  <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)} className="w-full h-10 text-[9px]">
                    Cancel
                  </SharpButton>
               </div>
            </motion.div>
          )}

          {view === ViewState.JOIN_ROOM && (
            <motion.div 
              key="join-room"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-4 bg-white/5 p-5 border border-white/10"
            >
               <div className="space-y-2">
                  <label className="text-[9px] text-white/30 uppercase font-black tracking-widest">Access Key</label>
                  <input 
                    type="text" 
                    placeholder="HM-XXXX"
                    className="w-full bg-black/40 border border-white/10 p-3 md:p-4 text-xl font-black text-white outline-none focus:border-ludo-red transition-all uppercase tracking-widest rounded-none"
                  />
               </div>

               <div className="flex flex-col gap-2 mt-2">
                  <SharpButton variant="primary" onClick={() => setView(ViewState.GAME)} className="w-full h-12">
                    Connect
                  </SharpButton>
                  <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)} className="w-full h-10 text-[9px]">
                    Back
                  </SharpButton>
               </div>
            </motion.div>
          )}

          {view === ViewState.PLAYING_COMPUTER && (
             <motion.div 
               key="computer"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="text-center flex flex-col gap-4"
             >
                <div className="bg-white/5 p-6 md:p-8 border border-white/10">
                  <div className="w-10 h-10 md:w-12 md:h-12 mx-auto bg-ludo-blue/20 flex items-center justify-center mb-3">
                     <Bot size={24} className="text-ludo-blue" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">System Node 01</h3>
                  <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Difficulty: Elite</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <SharpButton variant="primary" onClick={() => setView(ViewState.GAME)} className="w-full h-12 md:h-14">
                    Ignite Logic
                  </SharpButton>
                  <SharpButton variant="ghost" onClick={() => setView(ViewState.LOBBY)} className="w-full h-10 text-[9px]">
                    Abandon
                  </SharpButton>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
