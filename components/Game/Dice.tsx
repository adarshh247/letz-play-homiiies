import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface DiceProps {
  value: number;
  rolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
  color?: string; // Hex color for the dice accent
  className?: string;
}

export const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, disabled, color = '#FF4757', className }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80); // Faster roll
      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [rolling, value]);

  // Dice dots positions for 1-6
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <button 
      onClick={onRoll}
      disabled={disabled || rolling}
      className={clsx(
        "relative transition-transform active:scale-95 outline-none group perspective-1000",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105",
        className || "w-16 h-16"
      )}
    >
      <motion.div
        animate={rolling ? { 
          rotateX: [0, 360, 720, 1080], 
          rotateY: [0, 360, 720, 1080],
          scale: [1, 1.1, 0.9, 1.05, 1],
          y: [0, -10, 0]
        } : { 
          rotateX: 0, 
          rotateY: 0,
          scale: [1.1, 1], // Small pop when settling
        }}
        transition={{ duration: rolling ? 0.6 : 0.2, ease: "easeInOut" }}
        className="w-full h-full bg-white shadow-[0_5px_15px_rgba(0,0,0,0.3)] relative rounded-lg flex items-center justify-center"
        style={{ 
          border: `2px solid ${color}`,
        }}
      >
        {/* Sharp corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: color }} />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: color }} />

        {/* Dots Grid 3x3 */}
        <div className="w-full h-full p-2.5 grid grid-cols-3 grid-rows-3 gap-0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="flex items-center justify-center">
              {dots[displayValue]?.includes(idx) && (
                <div 
                  className="w-full h-full bg-ludo-dark rounded-full shadow-sm"
                  style={{ backgroundColor: color === '#ffffff' ? '#0f172a' : color }}
                 />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </button>
  );
};