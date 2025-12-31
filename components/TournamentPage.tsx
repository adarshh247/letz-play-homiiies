
import React from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Users, Clock, ArrowRight, Shield, Zap } from 'lucide-react';
import { User, Tournament } from '../types';
import { SharpButton } from './ui/SharpButton';
import { HomiieCoin } from './icons/HomiieCoin';

interface TournamentPageProps {
  user: User;
  onClose: () => void;
}

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'Neon Clash Masters',
    prize: 50000,
    entryFee: 1000,
    status: 'ongoing',
    participants: 124,
    maxParticipants: 256
  },
  {
    id: 't2',
    title: 'Homiie Pro Series',
    prize: 100000,
    entryFee: 5000,
    status: 'upcoming',
    startTime: '2h 15m',
    participants: 42,
    maxParticipants: 128
  },
  {
    id: 't3',
    title: 'Daily Protocol Cup',
    prize: 10000,
    entryFee: 250,
    status: 'ongoing',
    participants: 412,
    maxParticipants: 512
  }
];

export const TournamentPage: React.FC<TournamentPageProps> = ({ user, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="fixed inset-0 z-[100] bg-ludo-dark flex flex-col items-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl pt-8 pb-16">
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ludo-yellow/20 flex items-center justify-center">
                <Trophy size={24} className="text-ludo-yellow" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">Tournaments</h1>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">Competitive Protocol v2.4</p>
              </div>
           </div>
           <button onClick={onClose} className="text-white/30 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_TOURNAMENTS.map((t) => (
            <motion.div 
              key={t.id}
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 p-5 relative overflow-hidden group"
            >
              {/* Status Badge */}
              <div className={`absolute top-0 right-0 px-2 py-1 text-[8px] font-black uppercase tracking-widest ${t.status === 'ongoing' ? 'bg-ludo-green text-black' : 'bg-ludo-yellow text-black'}`}>
                {t.status}
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 mt-2 italic">{t.title}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-black">
                    <Shield size={12} /> Prize Pool
                  </div>
                  <div className="flex items-center gap-1.5 font-mono font-black text-ludo-yellow">
                    {t.prize.toLocaleString()} <HomiieCoin size={14} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-black">
                    <Users size={12} /> Participants
                  </div>
                  <div className="text-[10px] font-mono font-black text-white">
                    {t.participants} / {t.maxParticipants}
                  </div>
                </div>

                {t.startTime && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-black">
                      <Clock size={12} /> Starts In
                    </div>
                    <div className="text-[10px] font-mono font-black text-ludo-blue">
                      {t.startTime}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <SharpButton 
                  variant={user.coins >= t.entryFee ? 'accent' : 'outline'}
                  disabled={user.coins < t.entryFee}
                  className="flex-1 h-10 text-[10px]"
                >
                  Join Match ({t.entryFee} HC)
                </SharpButton>
              </div>

              <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Trophy size={80} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-8 border border-dashed border-white/10 text-center">
          <div className="w-12 h-12 bg-white/5 mx-auto flex items-center justify-center mb-4">
            <Zap size={24} className="text-white/20" />
          </div>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Season Rewards Expire in 14 Days</h4>
          <p className="text-[9px] text-white/20 uppercase tracking-widest mt-2">Climb the leaderboard to earn exclusive legendary avatars</p>
        </div>
      </div>
    </motion.div>
  );
};
