
import React from 'react';
import { User, ViewState } from '../types';
import { motion } from 'framer-motion';
import { HomiieCoin } from './icons/HomiieCoin';
import { Settings, Bell } from 'lucide-react';

interface TopBarProps {
  user: User;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenWallet, onOpenSettings, onOpenProfile }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-40 pointer-events-none">
      {/* Left: Premium Avatar Profile */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-4 pointer-events-auto"
      >
        <button 
          onClick={onOpenProfile}
          className="relative group cursor-pointer outline-none"
        >
          {/* Avatar Ring Glow */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-ludo-red via-ludo-yellow to-ludo-green blur-md"
          />
          
          <div className="relative w-16 h-16 bg-ludo-dark rounded-full p-1 border-2 border-white/10 group-hover:border-white/30 transition-colors shadow-2xl">
             <div className="w-full h-full rounded-full overflow-hidden bg-white/5">
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
             </div>
             {/* Level Badge */}
             <div className="absolute -bottom-1 -right-1 bg-white text-ludo-dark text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-ludo-dark">
                {user.level}
             </div>
          </div>
        </button>
        
        <div className="flex flex-col">
          <span className="text-white font-black tracking-tight text-xl uppercase drop-shadow-md">{user.name}</span>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-ludo-green shadow-[0_0_8px_rgba(46,213,115,0.6)] animate-pulse" />
             <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase">Status: Elite</span>
          </div>
        </div>
      </motion.div>

      {/* Right: Homiie Coin & Notifications */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-3 pointer-events-auto"
      >
        <motion.button 
          onClick={onOpenWallet}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl border border-white/10 pl-2 pr-5 py-2 hover:bg-white/10 transition-all rounded-full shadow-xl group"
        >
          <HomiieCoin size={36} />
          <div className="flex flex-col items-start">
             <span className="text-ludo-yellow font-black font-mono text-lg leading-none tracking-tight">
               {user.coins.toLocaleString()}
             </span>
             <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Homiie Coins</span>
          </div>
          <motion.div 
            whileHover={{ rotate: 90 }}
            className="ml-2 w-6 h-6 bg-ludo-yellow/10 rounded-full flex items-center justify-center text-ludo-yellow text-sm font-black group-hover:bg-ludo-yellow group-hover:text-black transition-colors"
          >
            +
          </motion.div>
        </motion.button>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onOpenSettings}
            className="p-3 text-white/30 hover:text-white transition-all bg-white/5 rounded-full border border-white/5 hover:bg-white/10 hover:border-white/10"
          >
            <Settings size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
