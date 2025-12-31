
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
    <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-40 pointer-events-none">
      {/* Left: Premium Avatar Profile */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-2 md:gap-3 pointer-events-auto"
      >
        <button 
          onClick={onOpenProfile}
          className="relative group cursor-pointer outline-none"
        >
          <div className="relative w-9 h-9 md:w-11 md:h-11 bg-ludo-dark border border-white/10 group-hover:border-white/30 transition-colors shadow-xl rounded-none p-0.5">
             <div className="w-full h-full overflow-hidden bg-white/5 rounded-none">
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
             </div>
             {/* Level Badge */}
             <div className="absolute -bottom-1 -right-1 bg-white text-ludo-dark text-[7px] md:text-[8px] font-black px-1 py-0.5 shadow-lg border border-ludo-dark rounded-none leading-none">
                {user.level}
             </div>
          </div>
        </button>
        
        <div className="flex flex-col">
          <span className="text-white font-black tracking-tight text-xs md:text-sm uppercase drop-shadow-md leading-none">{user.name}</span>
          <div className="flex items-center gap-1 mt-0.5">
             <div className="w-1 h-1 bg-ludo-green shadow-[0_0_8px_rgba(46,213,115,0.6)]" />
             <span className="text-white/30 text-[7px] md:text-[8px] font-bold tracking-[0.2em] uppercase">Ready</span>
          </div>
        </div>
      </motion.div>

      {/* Right: Wallet & Settings */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-1.5 md:gap-2 pointer-events-auto"
      >
        <motion.button 
          onClick={onOpenWallet}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1.5 md:px-3 md:py-2 hover:bg-white/10 transition-all rounded-none shadow-xl group h-9 md:h-11"
        >
          <HomiieCoin size={18} />
          <span className="text-ludo-yellow font-black font-mono text-xs md:text-sm leading-none tracking-tight">
            {user.coins.toLocaleString()}
          </span>
          <div className="w-3.5 h-3.5 bg-ludo-yellow/10 flex items-center justify-center text-ludo-yellow text-[9px] font-black group-hover:bg-ludo-yellow group-hover:text-black transition-colors rounded-none ml-1">
            +
          </div>
        </motion.button>

        <button 
          onClick={onOpenSettings}
          className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center text-white/30 hover:text-white transition-all bg-white/5 border border-white/10 hover:bg-white/10 rounded-none"
        >
          <Settings size={14} />
        </button>
      </motion.div>
    </div>
  );
};
