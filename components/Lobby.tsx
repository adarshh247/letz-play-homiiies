
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, ArrowLeft, Plus, LogIn, Play } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { ViewState } from '../types';

interface LobbyProps {
  view: ViewState;
  setView: (view: ViewState) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ view, setView }) => {
  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.4
      } 
    },
    exit: { opacity: 0, x: 20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Helper to render title based on view
  const getTitle = () => {
    switch (view) {
      case ViewState.FRIEND_OPTIONS: return "Play with Friend";
      case ViewState.CREATE_ROOM: return "Create Room";
      case ViewState.JOIN_ROOM: return "Join Room";
      case ViewState.GAME: return ""; // No title in game
      default: return "Lets Play Homiies";
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
      
      {/* Dynamic Title */}
      {view !== ViewState.GAME && (
        <motion.div 
          key={view}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 uppercase tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {getTitle()}
          </h1>
          {view === ViewState.LOBBY && (
            <p className="text-ludo-blue mt-2 font-mono tracking-widest text-sm md:text-base">THE ULTIMATE LUDO EXPERIENCE</p>
          )}
        </motion.div>
      )}

      <div className="w-full max-w-md min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* MAIN MODE SELECTION */}
          {view === ViewState.LOBBY && (
            <motion.div 
              key="main-menu"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <motion.div variants={itemVariants}>
                <SharpButton 
                  className="w-full h-24 text-2xl border-ludo-green hover:bg-ludo-green hover:text-ludo-dark"
                  icon={<Users size={32} />}
                  onClick={() => setView(ViewState.FRIEND_OPTIONS)}
                >
                  Play with Friend
                </SharpButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <SharpButton 
                  className="w-full h-24 text-2xl border-ludo-blue hover:bg-ludo-blue hover:text-white"
                  icon={<Bot size={32} />}
                  onClick={() => setView(ViewState.PLAYING_COMPUTER)}
                >
                  Against Computer
                </SharpButton>
              </motion.div>
            </motion.div>
          )}

          {/* FRIEND OPTIONS SUB-MENU */}
          {view === ViewState.FRIEND_OPTIONS && (
            <motion.div 
              key="friend-options"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <motion.div variants={itemVariants}>
                <SharpButton 
                  variant="accent"
                  className="w-full h-20"
                  icon={<Plus size={24} />}
                  onClick={() => setView(ViewState.CREATE_ROOM)}
                >
                  Create Room
                </SharpButton>
              </motion.div>

              <motion.div variants={itemVariants}>
                <SharpButton 
                  variant="primary"
                  className="w-full h-20"
                  icon={<LogIn size={24} />}
                  onClick={() => setView(ViewState.JOIN_ROOM)}
                >
                  Join Room
                </SharpButton>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4">
                 <SharpButton variant="ghost" onClick={() => setView(ViewState.LOBBY)} icon={<ArrowLeft />}>
                    Back
                 </SharpButton>
              </motion.div>
            </motion.div>
          )}

          {/* CREATE ROOM UI (Mock) */}
          {view === ViewState.CREATE_ROOM && (
            <motion.div 
              key="create-room"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-6 bg-black/40 p-8 border-2 border-ludo-red backdrop-blur-md"
            >
               <div className="text-center">
                  <p className="text-white/60 mb-2 font-mono">ROOM CODE</p>
                  <div className="text-4xl font-black text-ludo-red tracking-[1rem] bg-black/50 p-4 border-2 border-white/20 select-all cursor-pointer hover:border-ludo-red transition-colors">
                     HM-8X2
                  </div>
                  <p className="text-xs text-white/40 mt-2">Share this code with your homiies</p>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span>You (Host)</span>
                    <span className="text-ludo-green">Ready</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2 opacity-50">
                    <span>Waiting for player...</span>
                    <span className="animate-pulse">...</span>
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)} className="flex-1">
                    Cancel
                  </SharpButton>
                  <SharpButton variant="accent" className="flex-1" onClick={() => setView(ViewState.GAME)}>
                    Start Game
                  </SharpButton>
               </div>
            </motion.div>
          )}

          {/* JOIN ROOM UI (Mock) */}
          {view === ViewState.JOIN_ROOM && (
            <motion.div 
              key="join-room"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-6 bg-black/40 p-8 border-2 border-white backdrop-blur-md"
            >
               <div className="space-y-2">
                  <label className="text-white/60 font-mono text-sm">ENTER ROOM CODE</label>
                  <input 
                    type="text" 
                    placeholder="e.g. HM-8X2"
                    className="w-full bg-black/50 border-2 border-white/20 p-4 text-2xl font-bold text-white placeholder-white/20 outline-none focus:border-ludo-green transition-colors uppercase tracking-widest text-center"
                  />
               </div>

               <div className="flex gap-4 pt-4">
                  <SharpButton variant="ghost" onClick={() => setView(ViewState.FRIEND_OPTIONS)} className="flex-1">
                    Cancel
                  </SharpButton>
                  <SharpButton variant="primary" className="flex-1" onClick={() => setView(ViewState.GAME)}>
                    Join
                  </SharpButton>
               </div>
            </motion.div>
          )}

          {/* COMPUTER GAME SETUP */}
          {view === ViewState.PLAYING_COMPUTER && (
             <motion.div 
               key="computer"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="text-center"
             >
                <div className="w-20 h-20 mx-auto bg-ludo-blue flex items-center justify-center mb-6 animate-pulse">
                   <Bot size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Initializing AI...</h3>
                <p className="text-white/50 mb-8">The computer is ready. Are you?</p>
                <div className="flex gap-4">
                  <SharpButton variant="outline" onClick={() => setView(ViewState.LOBBY)} className="flex-1">
                    Cancel
                  </SharpButton>
                  <SharpButton variant="primary" onClick={() => setView(ViewState.GAME)} className="flex-1">
                    Start Match
                  </SharpButton>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
