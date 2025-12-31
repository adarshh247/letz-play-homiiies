
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
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
  const controls = useAnimation();
  const [prevLocation, setPrevLocation] = useState<string | null>(null);

  const getColors = (c: PlayerColor) => {
    switch (c) {
      case 'red': return { body: '#FF4757', light: '#ff6b81', dark: '#c41d2f' };
      case 'green': return { body: '#2ED573', light: '#7bed9f', dark: '#26af61' };
      case 'blue': return { body: '#1E90FF', light: '#70a1ff', dark: '#0c2461' };
      case 'yellow': return { body: '#FFA502', light: '#ffc048', dark: '#e58e26' };
    }
  };

  const theme = getColors(color);

  // Trigger a jump animation when the pawn moves (handled by layout changes)
  // LayoutId automatically animates between positions. We add a scale and y-offset for extra "juice".

  return (
    <motion.div
      layoutId={`pawn-${id}`}
      onClick={isClickable ? onClick : undefined}
      initial={false}
      animate={{ 
        scale: isClickable ? 1.15 : 1,
        y: isClickable ? -4 : 0
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8,
        layout: { duration: 0.25, type: "spring", stiffness: 350, damping: 20 }
      }}
      className={clsx(
        "relative flex items-center justify-center",
        size === 'small' ? "w-[80%] h-[80%] -mb-[10%] z-10" : "w-[140%] h-[140%] -mb-[30%] z-20",
        isClickable ? "cursor-pointer z-50 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" : "cursor-default drop-shadow-md",
      )}
    >
      <AnimatePresence>
        {pulse && isClickable && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/40 blur-xl rounded-full -z-10"
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

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

         {/* Selection Glow for clickable pawns */}
         {isClickable && (
           <motion.ellipse 
             cx="50" cy="110" rx="35" ry="10" 
             fill="none" 
             stroke="white" 
             strokeWidth="2"
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: [0.5, 0], scale: 1.8 }}
             transition={{ duration: 1.2, repeat: Infinity }}
           />
         )}

         {/* Base Shadow */}
         <ellipse cx="50" cy="108" rx="35" ry="12" fill="rgba(0,0,0,0.35)" />

         {/* Cone Body */}
         <path 
           d="M20 105 L50 25 L80 105 Q50 115 20 105 Z" 
           fill={`url(#grad-body-${id})`}
           stroke={theme.dark}
           strokeWidth="1"
         />

         {/* Head */}
         <circle cx="50" cy="25" r="20" fill={`url(#grad-head-${id})`} stroke={theme.dark} strokeWidth="1" />
         
         {/* Shiny Highlight */}
         <circle cx="42" cy="18" r="6" fill="rgba(255,255,255,0.7)" filter="blur(2px)" />
      </svg>
    </motion.div>
  );
};

import { AnimatePresence } from 'framer-motion';
