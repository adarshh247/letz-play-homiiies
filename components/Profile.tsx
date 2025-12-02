import React from 'react';
import { User } from '../types';
import { Coins, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileProps {
  user: User;
  onOpenSpin: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onOpenSpin }) => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute top-6 right-6 flex items-center gap-4 z-40"
    >
      {/* Coin Balance with Spin Trigger */}
      <motion.button 
        onClick={onOpenSpin}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-ludo-dark/80 backdrop-blur-md border-2 border-ludo-yellow px-4 py-2 hover:bg-ludo-yellow/20 transition-colors"
      >
        <Coins className="text-ludo-yellow w-5 h-5 animate-pulse" />
        <span className="font-bold text-white font-mono">{user.coins.toLocaleString()}</span>
        <div className="w-2 h-2 rounded-full bg-ludo-red ml-1" title="Free spin available!" />
      </motion.button>

      {/* User Profile */}
      <div className="flex items-center gap-3 pl-4 border-l-2 border-white/10">
        <div className="text-right hidden sm:block">
          <div className="text-white font-bold text-sm tracking-wide">{user.name}</div>
          <div className="text-ludo-green text-xs font-mono">Online</div>
        </div>
        <div className="relative group cursor-pointer">
          <div className="w-12 h-12 border-2 border-white overflow-hidden relative">
             <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
          </div>
          {/* Status Dot */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-ludo-green border-2 border-ludo-dark" />
        </div>
        
        <button className="p-2 text-white/50 hover:text-white transition-colors">
            <Settings size={20} />
        </button>
      </div>
    </motion.div>
  );
};