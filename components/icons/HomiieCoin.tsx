
import React from 'react';
import { motion } from 'framer-motion';

export const HomiieCoin: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF200" />
            <stop offset="45%" stopColor="#FFD700" />
            <stop offset="55%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <clipPath id="coinCircle">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="url(#coinGrad)" stroke="#000" strokeWidth="1.5" />
        {/* Inner Detail */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="4" />
        
        {/* The 'H' Logo - Made less bold and more modern/casual */}
        <text 
          x="50" 
          y="66" 
          textAnchor="middle" 
          fill="#000" 
          fontSize="48" 
          fontWeight="600" 
          fontFamily="'Space Grotesk', sans-serif"
          className="select-none"
        >
          H
        </text>

        {/* Shimmer Effect */}
        <motion.rect
          x="-100"
          y="0"
          width="100"
          height="100"
          fill="url(#shimmerGrad)"
          clipPath="url(#coinCircle)"
          animate={{ x: [ -100, 200 ] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        >
          <defs>
            <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </motion.rect>
      </svg>
      
      {/* Ambient Glow */}
      <motion.div 
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md -z-10"
      />
    </div>
  );
};
