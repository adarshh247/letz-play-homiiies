import React from 'react';
import { motion } from 'framer-motion';
import { PlayerColor } from '../../types';
import { clsx } from 'clsx';

interface PawnProps {
  color: PlayerColor;
  id: string;
  isClickable?: boolean;
  onClick?: () => void;
  pulse?: boolean;
  size?: 'normal' | 'small';
}

export const Pawn: React.FC<PawnProps> = ({ color, id, isClickable, onClick, pulse, size = 'normal' }) => {
  const getColors = (c: PlayerColor) => {
    switch (c) {
      case 'red': return { body: '#FF4757', light: '#ff6b81', dark: '#c41d2f' };
      case 'green': return { body: '#2ED573', light: '#7bed9f', dark: '#26af61' };
      case 'blue': return { body: '#1E90FF', light: '#70a1ff', dark: '#0c2461' };
      case 'yellow': return { body: '#FFA502', light: '#ffc048', dark: '#e58e26' };
    }
  };

  const theme = getColors(color);

  return (
    <motion.div
      layoutId={`pawn-${id}`}
      onClick={isClickable ? onClick : undefined}
      initial={false}
      animate={{ scale: isClickable ? 1.1 : 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        mass: 1
      }}
      className={clsx(
        "relative flex items-center justify-center transition-all duration-200",
        size === 'small' ? "w-[80%] h-[80%] -mb-[10%] z-10" : "w-[140%] h-[140%] -mb-[30%] z-20",
        isClickable ? "cursor-pointer z-50 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "cursor-default drop-shadow-md",
      )}
    >
      {/* SVG Cone Shape */}
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl overflow-visible">
         <defs>
           <radialGradient id={`grad-head-${id}`} cx="30%" cy="30%" r="70%">
             <stop offset="0%" stopColor={theme.light} />
             <stop offset="100%" stopColor={theme.body} />
           </radialGradient>
           <linearGradient id={`grad-body-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor={theme.body} />
             <stop offset="50%" stopColor={theme.light} />
             <stop offset="100%" stopColor={theme.dark} />
           </linearGradient>
         </defs>

         {/* Selection Ring */}
         {isClickable && (
           <motion.ellipse 
             cx="50" cy="110" rx="40" ry="10" 
             fill="none" 
             stroke="white" 
             strokeWidth="4"
             initial={{ opacity: 0, rx: 20 }}
             animate={{ opacity: [1, 0], rx: 50, ry: 15 }}
             transition={{ duration: 1, repeat: Infinity }}
           />
         )}

         {/* Shadow Base */}
         <ellipse cx="50" cy="105" rx="35" ry="12" fill="rgba(0,0,0,0.4)" />

         {/* Cone Body */}
         <path 
           d="M20 105 L50 25 L80 105 Q50 115 20 105 Z" 
           fill={`url(#grad-body-${id})`}
           stroke={theme.dark}
           strokeWidth="1"
         />

         {/* Head */}
         <circle cx="50" cy="25" r="20" fill={`url(#grad-head-${id})`} stroke={theme.dark} strokeWidth="1" />
         
         {/* Highlight on Head */}
         <circle cx="40" cy="18" r="6" fill="rgba(255,255,255,0.6)" filter="blur(2px)" />
      </svg>
      
      {/* Pulsing Aura for active turn */}
      {pulse && isClickable && (
         <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse -z-10" />
      )}
    </motion.div>
  );
};