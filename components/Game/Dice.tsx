
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface DiceProps {
  value: number;
  rolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
  color?: string;
  className?: string;
}

export const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, disabled, color = '#FF4757', className }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [showImpact, setShowImpact] = useState(false);
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const landSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    rollSoundRef.current = new Audio('https://cdn.freesound.org/previews/276/276142_5123851-lq.mp3');
    landSoundRef.current = new Audio('https://cdn.freesound.org/previews/566/566459_12497676-lq.mp3');
    if (rollSoundRef.current) rollSoundRef.current.volume = 0.3;
    if (landSoundRef.current) landSoundRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (rolling) {
      setShowImpact(false);
      rollSoundRef.current?.play().catch(() => {});
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      return () => clearInterval(interval);
    } else {
      rollSoundRef.current?.pause();
      if (rollSoundRef.current) rollSoundRef.current.currentTime = 0;
      setDisplayValue(value);
      
      if (value > 0) {
        setShowImpact(true);
        setTimeout(() => setShowImpact(false), 500);
      }
    }
  }, [rolling, value]);

  useEffect(() => {
    if (!rolling && landSoundRef.current && value) {
        landSoundRef.current.play().catch(() => {});
    }
  }, [rolling, value]);

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
        "relative outline-none transition-all rounded-2xl",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95",
        className || "w-14 h-14"
      )}
    >
      <AnimatePresence>
        {showImpact && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/40 rounded-2xl blur-md -z-10"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={rolling ? { 
          rotateX: [0, 360, 720, 1080], 
          rotateY: [0, 360, 720, 1080], 
          y: [-10, 0, -10, 0],
          scale: [1, 1.2, 0.9, 1.1, 1]
        } : showImpact ? {
          x: [0, -4, 4, -2, 2, 0],
          y: [0, 4, -4, 2, -2, 0],
          scale: [1.1, 1]
        } : { rotateX: 0, rotateY: 0, scale: 1, x: 0, y: 0 }}
        transition={rolling ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
        className="w-full h-full bg-white relative flex items-center justify-center rounded-2xl border-2 border-black/10 shadow-lg preserve-3d"
      >
        <div className="w-full h-full p-2.5 grid grid-cols-3 grid-rows-3 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="flex items-center justify-center">
              {dots[displayValue]?.includes(idx) && (
                <motion.div 
                  layoutId={`dot-${idx}`}
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: color }} 
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </button>
  );
};
