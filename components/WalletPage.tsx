
import React from 'react';
import { motion } from 'framer-motion';
import { X, Gift, Share2, CreditCard, Sparkles, TrendingUp, PlayCircle, CalendarCheck, ArrowRight } from 'lucide-react';
import { HomiieCoin } from './icons/HomiieCoin';
import { SharpButton } from './ui/SharpButton';
import { User } from '../types';

interface WalletPageProps {
  user: User;
  onClose: () => void;
  onOpenSpin: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ user, onClose, onOpenSpin }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ludo-dark flex flex-col items-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-sm pt-8 pb-16">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
           <div className="flex items-center gap-3">
              <HomiieCoin size={28} />
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">Finances</h1>
           </div>
           <button onClick={onClose} className="text-white/30 hover:text-white transition-all"><X size={24} /></button>
        </div>

        {/* Balance Card */}
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 mb-6 relative">
           <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Available Assets</div>
           <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter leading-none">
                {user.coins.toLocaleString()}
              </span>
              <span className="text-xs text-ludo-yellow font-black uppercase">HC</span>
           </div>
           <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-ludo-red" />
        </div>

        {/* Compact Actions */}
        <div className="space-y-3 mb-8">
           <SharpButton onClick={onOpenSpin} variant="accent" className="w-full h-11 md:h-12 text-xs" icon={<Sparkles size={16} />}>
             Lucky Spin
           </SharpButton>
           <SharpButton variant="outline" className="w-full h-11 md:h-12 text-xs" icon={<PlayCircle size={16} />}>
             Watch Ad
           </SharpButton>
           
           <div className="grid grid-cols-1 gap-2 mt-6">
              <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 px-1">Marketplace</div>
              {[
                { name: 'Micro', hc: '500', price: '$0.99' },
                { name: 'Mega', hc: '2,500', price: '$3.99' },
                { name: 'Core', hc: '10,000', price: '$14.99' }
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 md:p-4 bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                   <div>
                      <div className="text-[10px] font-black text-white uppercase leading-tight group-hover:text-ludo-red transition-colors">{p.name} Pack</div>
                      <div className="text-xs text-ludo-yellow font-mono mt-0.5">{p.hc} HC</div>
                   </div>
                   <SharpButton variant="secondary" className="h-7 px-3 text-[9px] border-none font-bold">{p.price}</SharpButton>
                </div>
              ))}
           </div>
        </div>

        <div className="text-center opacity-10 text-[8px] font-mono uppercase tracking-[0.4em]">
          Secure Gateway Protocol
        </div>
      </div>
    </motion.div>
  );
};
