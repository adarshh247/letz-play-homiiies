
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Edit3, LogOut, Check, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { SharpButton } from './ui/SharpButton';

interface ProfileOverlayProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'John', 'Sarah', 'CoolHomiie', 'Spike', 'Milo', 'Luna'];

export const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ isOpen, user, onClose, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);

  useEffect(() => {
    if (isOpen) {
      setEditedName(user.name);
      setSelectedAvatar(user.avatarUrl);
      setIsEditing(false);
    }
  }, [isOpen, user]);

  const stats = [
    { label: 'Wins', value: user.stats.gamesWon, color: 'text-ludo-yellow' },
    { label: 'Losses', value: user.stats.gamesLost, color: 'text-ludo-red' },
    { label: 'Streak', value: user.stats.winStreak, color: 'text-ludo-green' },
    { label: 'Captured', value: user.stats.tokensCaptured, color: 'text-ludo-blue' },
  ];

  const handleSave = () => {
    onUpdateUser({ name: editedName, avatarUrl: selectedAvatar });
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ludo-dark/95 backdrop-blur-md overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-ludo-dark border border-white/10 w-full max-w-sm relative rounded-none shadow-2xl my-auto flex-shrink-0"
          >
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-white/30 hover:text-white transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="editing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 italic">Re-Initialize Identity</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Neural Handle</label>
                      <input 
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 p-3 text-white font-black text-sm outline-none focus:border-ludo-yellow"
                        placeholder="Enter Name..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Avatar Cluster</label>
                      <div className="grid grid-cols-4 gap-2">
                        {AVATAR_SEEDS.map((seed) => {
                          const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                          const isSelected = selectedAvatar === url;
                          return (
                            <button 
                              key={seed}
                              onClick={() => setSelectedAvatar(url)}
                              className={`aspect-square border transition-all p-1 ${isSelected ? 'border-ludo-yellow bg-ludo-yellow/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                            >
                              <img src={url} alt={seed} className="w-full h-full" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <SharpButton onClick={handleSave} variant="primary" className="flex-1 h-10 text-xs">Confirm</SharpButton>
                      <SharpButton onClick={() => setIsEditing(false)} variant="ghost" className="flex-1 h-10 text-xs">Cancel</SharpButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="display"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {/* Identity Section */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 border border-white/10 p-1 flex-shrink-0 relative">
                        <img src={user.avatarUrl} className="w-full h-full object-cover bg-white/5" alt={user.name} />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter italic leading-none">{user.name}</h2>
                        <div className="text-[9px] font-mono text-ludo-yellow uppercase tracking-widest mt-1">Level {user.level} Master</div>
                      </div>
                    </div>

                    {/* Minimal Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {stats.map((stat, idx) => (
                        <div key={idx} className="border-l-2 border-white/5 pl-3 py-1 bg-white/[0.02]">
                          <div className="text-[8px] text-white/20 font-black uppercase tracking-widest">{stat.label}</div>
                          <div className={`text-lg md:text-xl font-black font-mono leading-none ${stat.color}`}>{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Level Progress */}
                    <div className="mb-6 p-4 bg-white/5 border border-white/5">
                      <div className="flex justify-between text-[8px] font-black uppercase mb-1.5">
                        <span className="text-white/40">Progression</span>
                        <span className="text-ludo-yellow">85%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          className="h-full bg-ludo-yellow shadow-[0_0_8px_rgba(255,165,2,0.5)]" 
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <SharpButton onClick={() => setIsEditing(true)} variant="outline" className="w-full h-10 text-xs" icon={<Edit3 size={14} />}>
                        Edit Identity
                      </SharpButton>
                      <SharpButton onClick={onLogout} variant="ghost" className="w-full h-10 text-xs text-ludo-red/60 hover:text-ludo-red hover:bg-ludo-red/5" icon={<LogOut size={14} />}>
                        Logout Node
                      </SharpButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
