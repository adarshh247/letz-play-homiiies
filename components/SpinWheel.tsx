import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { COIN_REWARDS } from '../types';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (amount: number) => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ isOpen, onClose, onReward }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    // Randomize outcome
    const randomIndex = Math.floor(Math.random() * COIN_REWARDS.length);
    const reward = COIN_REWARDS[randomIndex];
    
    // Calculate rotation: 
    // Minimum 5 spins (360 * 5) + segment offset
    const segmentAngle = 360 / COIN_REWARDS.length;
    // We want the pointer (top) to land on the segment.
    // If 0 deg is at top, each segment is at (index * segmentAngle).
    // To land on index i, we rotate negative relative to that? 
    // Actually easiest is to just spin a LOT and add a specific offset.
    // Let's keep it simple: Spin to a random high degree that aligns with a segment.
    
    // Slight randomization within the segment to look natural
    const randomOffset = Math.random() * (segmentAngle - 10) + 5; 
    
    // The visual wheel has 0 at top. 
    // Reward index 0 is at 0-60 deg, index 1 at 60-120, etc. (assuming 6 items)
    // To land on index 0, we need rotation % 360 to result in roughly 330-30 deg range if the pointer is top.
    // Let's simplify: Just rotate to a precise angle.
    // Pointer is at Top (12 o'clock). 
    // If we rotate the WHEEL clockwise, the segment passing 12 o'clock changes counter-clockwise index.
    
    // Let's just trust the visual for now and map the end result.
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 3));
    // Target angle for the specific index to be at the top.
    // If index 0 is at 0deg (top) initially. To keep it there, rot = 0.
    // If index 1 is at 60deg (right-top). To bring it to top, rot = -60 (or 300).
    const targetRotation = fullSpins - (randomIndex * segmentAngle);

    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(reward);
      onReward(reward);
    }, 4000); // 4s spin time matches CSS transition
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            className="relative bg-ludo-dark border-4 border-ludo-yellow p-8 w-full max-w-md flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(255,165,2,0.3)]"
            style={{ borderRadius: 0 }}
          >
            <button 
              onClick={onClose}
              disabled={isSpinning}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors disabled:opacity-30"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-white uppercase tracking-widest mb-1">Daily Spin</h2>
              <p className="text-ludo-yellow text-sm font-mono">Test your luck, homie!</p>
            </div>

            {/* Wheel Container */}
            <div className="relative w-64 h-64">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-white drop-shadow-lg">
                <div className="w-8 h-8 bg-white rotate-45 border-4 border-ludo-dark translate-y-2" />
              </div>

              {/* The Wheel */}
              <div 
                className="w-full h-full rounded-full border-8 border-white overflow-hidden relative shadow-2xl"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 4s cubic-bezier(0.15, 0, 0, 1)'
                }}
              >
                {COIN_REWARDS.map((amount, index) => {
                  const angle = 360 / COIN_REWARDS.length;
                  const isEven = index % 2 === 0;
                  return (
                    <div 
                      key={index}
                      className="absolute w-full h-full top-0 left-0 flex justify-center pt-4"
                      style={{ 
                        transform: `rotate(${index * angle}deg)`,
                        backgroundColor: isEven ? '#FF4757' : '#2ED573',
                        clipPath: 'polygon(50% 50%, 0 0, 100% 0)' // Rough sector approximation logic, usually cleaner with SVG
                      }}
                    >
                      {/* Using CSS Conic Gradients is easier for the background, but this text placement works if we are careful */}
                    </div>
                  );
                })}
                
                {/* SVG Overlay for perfect sectors */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  {COIN_REWARDS.map((_, i) => {
                     // 6 segments
                     const angle = 360 / 6;
                     const startAngle = (i * angle) - 90 - (angle/2); // Adjust start to align correctly
                     // Let's use a simpler full SVG approach or a conic gradient background div
                     return null;
                  })}
                </svg>

                {/* Better Background Approach: Conic Gradient */}
                <div className="absolute inset-0 rounded-full" 
                     style={{ 
                       background: `conic-gradient(
                         #FF4757 0deg 60deg, 
                         #2ED573 60deg 120deg, 
                         #1E90FF 120deg 180deg, 
                         #FFA502 180deg 240deg, 
                         #FF4757 240deg 300deg, 
                         #2ED573 300deg 360deg
                       )`
                     }} 
                />
                 {/* Text Overlay */}
                 {COIN_REWARDS.map((amount, index) => (
                    <div 
                      key={index}
                      className="absolute w-full h-full top-0 left-0 text-center pt-6 font-bold text-white text-lg drop-shadow-md"
                      style={{ transform: `rotate(${index * (360/6)}deg)` }}
                    >
                      <span className="block transform -rotate-0">{amount > 0 ? amount : '☹️'}</span>
                    </div>
                 ))}
              </div>
              
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full z-10 flex items-center justify-center border-4 border-ludo-dark shadow-inner">
                 <Gift className="text-ludo-red w-8 h-8" />
              </div>
            </div>

            <div className="h-16 flex items-center justify-center w-full">
              {result !== null ? (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-ludo-yellow"
                >
                  {result === 0 ? "Better luck next time!" : `You won ${result} coins!`}
                </motion.div>
              ) : (
                 <p className="text-white/50 text-sm">{isSpinning ? "Good luck..." : "Spin to win big!"}</p>
              )}
            </div>

            <SharpButton 
              onClick={handleSpin} 
              disabled={isSpinning || result !== null}
              className="w-full"
            >
              {isSpinning ? 'Spinning...' : result !== null ? 'Done' : 'Spin Now'}
            </SharpButton>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};