
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ludo-dark flex flex-col items-center p-6 overflow-y-auto"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <HomiieCoin size={600} className="absolute -top-40 -right-40 rotate-12" />
        <HomiieCoin size={400} className="absolute -bottom-20 -left-20 -rotate-12" />
      </div>

      <div className="w-full max-w-2xl z-10 pt-8 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-4">
              <HomiieCoin size={64} />
              <div>
                 <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Wallet</h1>
                 <p className="text-ludo-yellow text-[10px] font-mono tracking-[0.3em] uppercase mt-1">Homiie Financial</p>
              </div>
           </div>
           <button 
             onClick={onClose} 
             className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:rotate-90"
           >
              <X size={32} />
           </button>
        </div>

        {/* Balance Display Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-10 mb-8 relative overflow-hidden rounded-3xl"
        >
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/40 text-xs font-black uppercase tracking-widest">Balance</span>
                <div className="h-[1px] w-8 bg-white/20" />
              </div>
              <div className="flex items-baseline gap-4">
                 <span className="text-7xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                   {user.coins.toLocaleString()}
                 </span>
                 <span className="text-xl text-ludo-yellow font-black uppercase italic">HC</span>
              </div>
           </div>
           {/* Visual Flourish */}
           <TrendingUp className="absolute right-[-20px] bottom-[-20px] text-white opacity-[0.03] w-64 h-64 rotate-[-15deg]" />
           <div className="absolute top-0 right-0 w-32 h-32 bg-ludo-yellow/10 blur-[60px] rounded-full" />
        </motion.div>

        {/* Earning Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Daily Reward Row (Spans full width) */}
          <motion.div 
            variants={itemVariants}
            className="col-span-1 md:col-span-2 bg-gradient-to-r from-ludo-green/20 to-transparent border border-ludo-green/30 p-6 flex justify-between items-center group cursor-pointer hover:border-ludo-green transition-all rounded-2xl"
          >
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-ludo-green text-ludo-dark flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(46,213,115,0.3)]">
                   <CalendarCheck size={24} />
                </div>
                <div>
                   <h3 className="font-black text-white uppercase text-lg">Daily Check-in</h3>
                   <p className="text-white/40 text-xs">Collect your daily 100 HC reward</p>
                </div>
             </div>
             <SharpButton className="h-10 px-6 text-xs" variant="primary">Claim</SharpButton>
          </motion.div>

          {/* Spin Card */}
          <motion.button 
            variants={itemVariants}
            onClick={onOpenSpin}
            className="bg-white/5 border border-white/10 p-6 flex items-center gap-4 hover:bg-ludo-red/10 hover:border-ludo-red transition-all text-left group rounded-2xl"
          >
             <div className="w-14 h-14 bg-ludo-red flex items-center justify-center text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Sparkles size={28} className="group-hover:animate-spin" />
             </div>
             <div>
                <h3 className="font-black text-white text-base uppercase tracking-tight">Lucky Spin</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Available Daily</p>
             </div>
          </motion.button>

          {/* Watch & Earn Card */}
          <motion.button 
            variants={itemVariants}
            className="bg-white/5 border border-white/10 p-6 flex items-center gap-4 hover:bg-ludo-blue/10 hover:border-ludo-blue transition-all text-left group rounded-2xl"
          >
             <div className="w-14 h-14 bg-ludo-blue flex items-center justify-center text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <PlayCircle size={28} />
             </div>
             <div>
                <h3 className="font-black text-white text-base uppercase tracking-tight">Watch & Earn</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">+50 HC per video</p>
             </div>
          </motion.button>

          {/* Refer Card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/5 border border-white/10 p-6 flex items-center gap-4 hover:bg-white/10 transition-all rounded-2xl md:col-span-2"
          >
             <div className="w-14 h-14 bg-white/10 flex items-center justify-center text-white rounded-xl">
                <Share2 size={24} />
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-base uppercase tracking-tight">Refer a Homiie</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="bg-black/40 px-3 py-1 text-ludo-yellow font-mono font-black text-sm border border-white/5 tracking-wider">HOMIIE_X</span>
                   <button className="text-[10px] text-white/60 hover:text-white underline uppercase font-bold transition-colors">Copy Link</button>
                </div>
             </div>
             <div className="text-right pr-4">
               <div className="text-ludo-yellow font-black text-lg">+1,000</div>
               <div className="text-white/20 text-[8px] font-bold uppercase">Reward</div>
             </div>
          </motion.div>

          {/* Shop Header */}
          <div className="col-span-1 md:col-span-2 mt-10 mb-2">
             <div className="flex items-center gap-4">
               <h2 className="text-white/40 font-black uppercase tracking-[0.4em] text-xs">Coin Store</h2>
               <div className="h-[1px] flex-1 bg-white/5" />
             </div>
          </div>

          {/* Shop Items */}
          {[
            { name: 'Starter Pack', coins: 500, price: '$0.99', icon: <HomiieCoin size={24} /> },
            { name: 'Homiie Box', coins: 2500, price: '$3.99', icon: <div className="flex"><HomiieCoin size={24}/><HomiieCoin size={24} className="-ml-3"/></div> },
            { name: 'Vault Key', coins: 10000, price: '$14.99', icon: <Gift size={24} className="text-ludo-yellow" /> }
          ].map((item, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="bg-black/20 border border-white/5 p-5 flex justify-between items-center hover:border-white/20 transition-all group rounded-xl"
            >
               <div className="flex items-center gap-4">
                  <div className="group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                     <h4 className="font-bold text-white uppercase text-sm">{item.name}</h4>
                     <p className="text-xs text-ludo-yellow font-mono">{item.coins.toLocaleString()} HC</p>
                  </div>
               </div>
               <SharpButton className="h-9 px-5 text-[10px] min-w-[80px]" variant="outline">{item.price}</SharpButton>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer info */}
        <div className="mt-16 text-center border-t border-white/5 pt-10">
           <div className="inline-flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.5em] hover:text-white/40 transition-colors cursor-default">
              Encrypted Transaction <ArrowRight size={10} />
           </div>
        </div>
      </div>
    </motion.div>
  );
};
