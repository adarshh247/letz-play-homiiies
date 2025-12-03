import React from 'react';
import { motion } from 'framer-motion';

interface DIYControlProps {
  onSelect: (value: number) => void;
}

export const DIYControl: React.FC<DIYControlProps> = ({ onSelect }) => {
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-black/90 backdrop-blur-xl p-6 border-2 border-ludo-red shadow-[0_0_50px_rgba(255,71,87,0.5)] flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <div className="text-ludo-red font-black text-xl uppercase tracking-widest animate-pulse">DIY MODE</div>
        <div className="text-white/60 text-xs font-mono mt-1">OVERRIDE OUTCOME</div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className="w-14 h-14 bg-white/5 hover:bg-ludo-red text-white border-2 border-white/20 hover:border-white font-bold text-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center font-mono"
          >
            {num}
          </button>
        ))}
      </div>
      
      <div className="h-1 w-full bg-white/10 overflow-hidden mt-2">
         <motion.div 
           className="h-full bg-ludo-red"
           initial={{ width: "100%" }}
           animate={{ width: "0%" }}
           transition={{ duration: 1, ease: "linear" }}
         />
      </div>
    </motion.div>
  );
};