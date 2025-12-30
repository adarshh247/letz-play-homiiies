
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Swords, Zap, Crosshair, Target, Edit3, LogOut, ChevronRight } from 'lucide-react';
import { User } from '../types';
import { SharpButton } from './ui/SharpButton';

interface ProfileOverlayProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

export const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ isOpen, user, onClose, onLogout, onEditProfile }) => {
  const stats = [
    { label: 'Games Won', value: user.stats.gamesWon, icon: <Trophy className="text-ludo-yellow" size={20} />, color: 'bg-ludo-yellow/10' },
    { label: 'Games Lost', value: user.stats.gamesLost, icon: <Swords className="text-ludo-red" size={20} />, color: 'bg-ludo-red/10' },
    { label: 'Win Streak', value: user.stats.winStreak, icon: <Zap className="text-ludo-green" size={20} />, color: 'bg-ludo-green/10' },
    { label: 'Tokens Captured', value: user.stats.tokensCaptured, icon: <Crosshair className="text-ludo-blue" size={20} />, color: 'bg-ludo-blue/10' },
    { label: 'Tournaments', value: user.stats.tournamentsWon, icon: <Target className="text-white" size={20} />, color: 'bg-white/10' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ludo-dark/80 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-ludo-dark border-2 border-white/10 w-full max-w-lg relative overflow-hidden shadow-2xl rounded-3xl"
          >
            {/* Header / Background Glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent -z-10" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            <div className="p-8 pt-12">
              {/* User Identity */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-ludo-yellow p-1 shadow-[0_0_30px_rgba(255,165,2,0.2)]">
                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover bg-white/10" alt={user.name} />
                  </div>
                  <div className="absolute -bottom-2 right-0 bg-white text-ludo-dark px-3 py-1 rounded-full font-black text-sm border-2 border-ludo-dark shadow-lg">
                    LVL {user.level}
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/40 text-xs font-mono uppercase tracking-widest">Homiie ID: #872-9X</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                {stats.map((stat, idx) => (
                  <div key={idx} className={`${stat.color} p-4 border border-white/5 rounded-2xl flex flex-col gap-2 group hover:border-white/20 transition-all`}>
                    <div className="flex items-center gap-3">
                      {stat.icon}
                      <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono group-hover:scale-105 transition-transform origin-left">
                      {stat.value.toLocaleString()}
                    </div>
                  </div>
                ))}
                
                {/* Ranking / Progress Card */}
                <div className="bg-white/5 p-4 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Next Level</span>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-ludo-yellow">85%</span>
                      <span className="text-white/30">1200 / 1500 XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-ludo-yellow w-[85%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <SharpButton 
                  onClick={onEditProfile}
                  variant="outline" 
                  className="w-full h-14 rounded-2xl normal-case text-base gap-4"
                >
                  <Edit3 size={18} />
                  Edit Profile
                  <ChevronRight size={16} className="ml-auto opacity-30" />
                </SharpButton>

                <SharpButton 
                  onClick={onLogout}
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl normal-case text-base text-ludo-red hover:bg-ludo-red/10 border-transparent gap-4"
                >
                  <LogOut size={18} />
                  Logout Account
                </SharpButton>
              </div>
            </div>

            <div className="p-6 bg-white/5 text-center text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
              Established 2025 • Homiies Network
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
