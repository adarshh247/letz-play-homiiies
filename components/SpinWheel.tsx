
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { COIN_REWARDS } from '../types';
import { HomiieCoin } from './icons/HomiieCoin';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (amount: number) => void;
  onDeduct: (amount: number) => boolean;
  userCoins: number;
}

const SPIN_COST = 100;

export const SpinWheel: React.FC<SpinWheelProps> = ({ isOpen, onClose, onReward, onDeduct, userCoins }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showWinMessage, setShowWinMessage] = useState(false);

  // Reset state when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setRotation(0);
      setResult(null);
      setShowWinMessage(false);
    }
  }, [isOpen]);

  const handleSpin = () => {
    if (isSpinning) return;
    
    // Attempt to deduct cost
    const success = onDeduct(SPIN_COST);
    if (!success) return;

    setIsSpinning(true);
    setResult(null);
    setShowWinMessage(false);

    // Calculate random reward index
    const randomIndex = Math.floor(Math.random() * COIN_REWARDS.length);
    const reward = COIN_REWARDS[randomIndex];
    
    const segmentAngle = 360 / COIN_REWARDS.length;
    // Each segment i is rendered at angle: i * segmentAngle + (segmentAngle / 2)
    // To land segment i center at the top (0 deg), we need wheel rotation R:
    // (i * segmentAngle + segmentAngle / 2) + R = 0 (mod 360)
    // R = - (i * segmentAngle + segmentAngle / 2)
    
    const targetSegmentCenter = (randomIndex * segmentAngle) + (segmentAngle / 2);
    const fullSpins = 360 * 8; // Consistent 8 spins for tension
    
    // Calculate final rotation relative to current rotation
    // We subtract the current offset, add full spins, and subtract the target center offset
    const currentOffset = rotation % 360;
    const extraToReset = 360 - currentOffset;
    const finalRotation = rotation + extraToReset + fullSpins - targetSegmentCenter;

    setRotation(finalRotation);

    // Set timeout to match the 4s animation duration
    setTimeout(() => {
      setIsSpinning(false);
      setResult(reward);
      setShowWinMessage(true);
      onReward(reward);
    }, 4000);
  };

  const canAfford = userCoins >= SPIN_COST;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#0a0a0c] border border-white/10 p-6 md:p-10 w-full max-w-sm flex flex-col items-center gap-8 shadow-[0_0_100px_rgba(255,71,87,0.15)] my-auto"
            style={{ borderRadius: 0 }}
          >
            {/* Corner Decorative Elements */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-ludo-red opacity-50" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-ludo-red opacity-50" />

            <button 
              onClick={onClose}
              disabled={isSpinning}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors disabled:opacity-10 p-2"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic flex items-center justify-center gap-2">
                <Sparkles size={20} className="text-ludo-yellow" />
                LUCKY SPIN
                <Sparkles size={20} className="text-ludo-yellow" />
              </h2>
              <p className="text-white/20 text-[9px] font-mono uppercase tracking-[0.5em] mt-2">Quantum Probability Override</p>
            </div>

            {/* The Wheel Container */}
            <div className="relative w-56 h-56 md:w-72 md:h-72 flex-shrink-0">
              {/* Outer Glow Ring */}
              <div className="absolute inset-[-15px] rounded-full border border-white/5 bg-gradient-to-tr from-ludo-red/5 to-transparent animate-pulse" />
              
              {/* The Pointer (Fixed at Top) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                 <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-white" />
              </div>

              {/* The Spinning Part */}
              <motion.div 
                className="w-full h-full rounded-full border-4 border-[#1a1a1e] overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.15, 0, 0, 1] }}
              >
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
                
                {/* Visual Segment Lines */}
                {[0, 60, 120, 180, 240, 300].map(deg => (
                  <div 
                    key={deg} 
                    className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-black/20 origin-left"
                    style={{ transform: `rotate(${deg}deg)` }}
                  />
                ))}

                {/* Reward Values */}
                {COIN_REWARDS.map((amount, index) => {
                  const angle = index * (360/6);
                  return (
                    <div 
                      key={index}
                      className="absolute w-full h-full top-0 left-0 flex justify-center pt-6 pointer-events-none"
                      style={{ transform: `rotate(${angle + 30}deg)` }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-black text-white text-lg md:text-xl drop-shadow-lg italic">
                          {amount > 0 ? amount : 'RIP'}
                        </span>
                        {amount > 0 && <span className="text-[8px] font-bold text-black/40 uppercase">HC</span>}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
              
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0c] rounded-full z-10 flex items-center justify-center border-4 border-[#1a1a1e] shadow-2xl">
                 <div className="w-10 h-10 md:w-12 md:h-12 border border-white/10 rounded-full flex items-center justify-center bg-white/5">
                    <HomiieCoin size={24} />
                 </div>
              </div>
            </div>

            <div className="h-16 flex flex-col items-center justify-center w-full text-center">
              <AnimatePresence mode="wait">
                {showWinMessage && result !== null ? (
                  <motion.div 
                    key="win"
                    initial={{ y: 10, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="text-xl md:text-2xl font-black text-ludo-yellow uppercase tracking-tighter italic">
                      {result === 0 ? "BETTER LUCK NEXT TIME" : `+${result} HC CREDITED`}
                    </div>
                    {result > 0 && (
                      <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Transaction Verified</div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">
                      {isSpinning ? "CALCULATING TRAJECTORY..." : "READY FOR DEPLOYMENT"}
                    </p>
                    {!canAfford && !isSpinning && (
                      <p className="text-ludo-red text-[8px] font-bold uppercase mt-1">Insufficient Credits</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full flex flex-col gap-3">
              <SharpButton 
                onClick={handleSpin} 
                disabled={isSpinning || !canAfford}
                className="w-full h-12 md:h-14 group"
                variant={canAfford ? "accent" : "outline"}
                icon={!isSpinning && <HomiieCoin size={16} />}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black italic">{isSpinning ? 'SPINNING...' : 'SPIN'}</span>
                  {!isSpinning && <span className="w-px h-4 bg-white/20" />}
                  {!isSpinning && <span className="text-[10px] opacity-70">100 HC</span>}
                </div>
              </SharpButton>
              
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Current Balance</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-black text-ludo-yellow">{userCoins.toLocaleString()}</span>
                  <span className="text-[8px] font-black text-white/30">HC</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
