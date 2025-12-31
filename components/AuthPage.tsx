
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SharpButton } from './ui/SharpButton';
import { User, UserStats } from '../types';
import { User as UserIcon, Lock, Sparkles, Mail, Phone, UserPlus, LogIn } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const mockStats: UserStats = {
      gamesWon: 0,
      gamesLost: 0,
      winStreak: 0,
      tokensCaptured: 0,
      tournamentsWon: 0
    };

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: isLogin ? (formData.displayName || 'Guest') : formData.fullName.split(' ')[0],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.displayName || formData.fullName || 'Homiie'}`,
      coins: 1000,
      level: 1,
      stats: mockStats
    };

    onLogin(newUser);
  };

  const inputClasses = "w-full h-10 md:h-12 bg-white/5 border border-white/10 rounded-none px-10 text-white font-bold placeholder:text-white/10 focus:border-ludo-red focus:bg-white/10 outline-none transition-all text-xs";
  const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-ludo-red transition-colors";
  const labelClasses = "text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-ludo-dark flex items-start sm:items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-sm relative py-12 md:py-8">
        <motion.div 
          layout
          className="relative bg-black/40 border border-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-none shadow-[15px_15px_0px_rgba(0,0,0,0.3)]"
        >
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase mb-1">
              Homiies<span className="text-ludo-red">.</span>
            </h1>
            <p className="text-white/30 text-[9px] font-mono uppercase tracking-[0.4em]">
              {isLogin ? 'Identity Required' : 'Initialize Protocol'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin ? (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 md:space-y-4 overflow-hidden"
                >
                  <div className="group relative">
                    <label className={labelClasses}>Full Name</label>
                    <div className="relative">
                      <UserIcon className={iconClasses} size={14} />
                      <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className={inputClasses} required={!isLogin} />
                    </div>
                  </div>
                  <div className="group relative">
                    <label className={labelClasses}>Email</label>
                    <div className="relative">
                      <Mail className={iconClasses} size={14} />
                      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputClasses} required={!isLogin} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="group relative">
                  <label className={labelClasses}>Handle</label>
                  <div className="relative">
                    <UserIcon className={iconClasses} size={14} />
                    <input name="displayName" type="text" value={formData.displayName} onChange={handleChange} placeholder="Display Name" className={inputClasses} required={isLogin} />
                  </div>
                </div>
              )}
            </AnimatePresence>

            <div className="group relative">
              <label className={labelClasses}>Password</label>
              <div className="relative">
                <Lock className={iconClasses} size={14} />
                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className={inputClasses} required />
              </div>
            </div>

            {!isLogin && (
              <div className="group relative">
                <label className={labelClasses}>Confirm</label>
                <div className="relative">
                  <Lock className={iconClasses} size={14} />
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className={inputClasses} required={!isLogin} />
                </div>
              </div>
            )}

            <SharpButton type="submit" className="w-full h-12 md:h-14 mt-4" variant="accent">
              {isLogin ? 'Login' : 'Join Arena'}
            </SharpButton>
          </form>

          <div className="mt-6 md:mt-8 text-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/20 text-[9px] hover:text-white transition-colors uppercase font-black tracking-widest underline decoration-ludo-red underline-offset-4"
            >
              {isLogin ? "Create Account" : "Return to Login"}
            </button>
          </div>
        </motion.div>

        <div className="mt-6 text-center opacity-10">
          <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-white">Secure Gateway v1.0</p>
        </div>
      </div>
    </motion.div>
  );
};
