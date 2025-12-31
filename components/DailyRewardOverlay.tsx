
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, Gift, Star } from 'lucide-react';
import { SharpButton } from './ui/SharpButton';
import { HomiieCoin } from './icons/HomiieCoin';
// Added missing clsx import
import { clsx } from 'clsx';

interface DailyRewardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (amount: number) => void;
}

const REWARDS = [100, 200, 500, 1000, 2500, 5000, 10000];

export const DailyRewardOverlay: React.FC<DailyRewardOverlayProps> = ({ isOpen, onClose, onClaim }) => {
  const [streak, setStreak] = useState(1);
  const [lastClaimed, setLastClaimed] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    const savedStreak = localStorage.getItem('homiie_streak');
    const savedLastClaimed = localStorage.getItem('homiie_last_claimed');
    
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedLastClaimed) setLastClaimed(parseInt(savedLastClaimed));

    const checkClaimStatus = () => {
      if (!savedLastClaimed) {
        setCanClaim(true);
        return;
      }

      const now = new Date();
      const last = new Date(parseInt(savedLastClaimed));
      
      const isSameDay = now.toDateString() === last.toDateString();
      
      // Calculate day difference
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 2) {
        // Streak broken
        setStreak(1);
        localStorage.setItem('homiie_streak', '1');
        setCanClaim(true);
      } else if (!isSameDay) {
        setCanClaim(true);
      } else {
        setCanClaim(false);
      }
    };

    checkClaimStatus();
  }, [isOpen]);

  const handleClaim = () => {
    const amount = REWARDS[streak - 1];
    onClaim(amount);
    
    const now = new Date().getTime();
    const nextStreak = streak >= 7 ? 1 : streak + 1;
    
    setLastClaimed(now);
    setCanClaim(false);
    setStreak(nextStreak);
    
    localStorage.setItem('homiie_last_claimed', now.toString());
    localStorage.setItem('homiie_streak', nextStreak.toString());
    
    setTimeout(onClose, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ludo-dark/95 backdrop-blur-md overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-ludo-dark border border-white/10 w-full max-w-sm relative rounded-none shadow-2xl p-6 md:p-8 my-auto"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-all">
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Daily Protocol</h2>
              <p className="text-[9px] font-mono text-ludo-yellow uppercase tracking-[0.3em] mt-1">Sequence Day {streak}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8">
              {REWARDS.map((amount, idx) => {
                const day = idx + 1;
                const isCompleted = day < streak;
                const isCurrent = day === streak;
                
                return (
                  <div 
                    key={idx}
                    className={clsx(
                      "aspect-square flex flex-col items-center justify-center gap-1 border transition-all relative overflow-hidden",
                      isCompleted ? "bg-ludo-green/10 border-ludo-green/30 opacity-40" : 
                      isCurrent ? "bg-white/5 border-ludo-yellow shadow-[0_0_15px_rgba(255,165,2,0.2)]" : 
                      "bg-white/[0.02] border-white/5 opacity-30",
                      day === 7 ? "col-span-2 aspect-auto h-full" : ""
                    )}
                  >
                    <span className="text-[8px] font-black uppercase text-white/40">D{day}</span>
                    <div className="relative">
                      {isCompleted ? <Check size={14} className="text-ludo-green" /> : <HomiieCoin size={16} />}
                    </div>
                    <span className={clsx("text-[9px] font-black font-mono", isCurrent ? "text-ludo-yellow" : "text-white/60")}>
                      {amount}
                    </span>
                    {day === 7 && <Star size={8} className="absolute top-1 right-1 text-ludo-yellow fill-ludo-yellow" />}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <SharpButton 
                onClick={handleClaim} 
                disabled={!canClaim}
                variant={canClaim ? "primary" : "outline"}
                className="w-full h-12"
              >
                {canClaim ? `Claim ${REWARDS[streak-1]} HC` : "Protocol Locked"}
              </SharpButton>
              <p className="text-center text-[8px] font-mono text-white/20 uppercase tracking-widest">Reset occurs if sequence is broken</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
