
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
  
  // Form State
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
    
    // Basic validation for signup
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
      name: isLogin ? (formData.displayName || 'GuestHomiie') : formData.fullName.split(' ')[0],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.displayName || formData.fullName || 'Homiie'}`,
      coins: 1000,
      level: 1,
      stats: mockStats
    };

    onLogin(newUser);
  };

  const inputClasses = "w-full h-14 bg-white/5 border-2 border-white/5 rounded-2xl px-14 text-white font-bold placeholder:text-white/10 focus:border-ludo-yellow/50 focus:bg-white/10 outline-none transition-all text-sm";
  const iconClasses = "absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-ludo-yellow transition-colors";
  const labelClasses = "text-[10px] font-black text-white/30 uppercase tracking-widest ml-4 mb-1 block";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-ludo-dark flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-lg relative py-12">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-ludo-red/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-ludo-blue/10 blur-[100px] rounded-full" />

        <motion.div 
          layout
          className="relative bg-black/40 border border-white/10 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <motion.div 
              layoutId="auth-icon"
              className="w-16 h-16 bg-gradient-to-tr from-ludo-red via-ludo-yellow to-ludo-green rounded-2xl mb-4 flex items-center justify-center shadow-lg transform rotate-12"
            >
               <Sparkles size={32} className="text-white -rotate-12" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
              Homiies<span className="text-ludo-red">.</span>
            </h1>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em]">
              {isLogin ? 'Welcome Back, Homiie' : 'Join the Global Node'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin ? (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="group relative">
                    <label className={labelClasses}>Full Name</label>
                    <div className="relative">
                      <UserIcon className={iconClasses} size={18} />
                      <input 
                        name="fullName"
                        type="text" 
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Homiie Doe"
                        className={inputClasses}
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group relative">
                      <label className={labelClasses}>Email Address</label>
                      <div className="relative">
                        <Mail className={iconClasses} size={18} />
                        <input 
                          name="email"
                          type="email" 
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="hello@homiies.io"
                          className={inputClasses}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div className="group relative">
                      <label className={labelClasses}>Phone Number</label>
                      <div className="relative">
                        <Phone className={iconClasses} size={18} />
                        <input 
                          name="phone"
                          type="tel" 
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 234 567 890"
                          className={inputClasses}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="login-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="group relative">
                    <label className={labelClasses}>Display Name or Email</label>
                    <div className="relative">
                      <UserIcon className={iconClasses} size={18} />
                      <input 
                        name="displayName"
                        type="text" 
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="Your unique handle"
                        className={inputClasses}
                        required={isLogin}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative">
                <label className={labelClasses}>Password</label>
                <div className="relative">
                  <Lock className={iconClasses} size={18} />
                  <input 
                    name="password"
                    type="password" 
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={inputClasses}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative"
                >
                  <label className={labelClasses}>Confirm Password</label>
                  <div className="relative">
                    <Lock className={iconClasses} size={18} />
                    <input 
                      name="confirmPassword"
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={inputClasses}
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <SharpButton 
              type="submit" 
              className="w-full h-16 rounded-2xl mt-6 group overflow-hidden"
              icon={isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            >
              <span className="relative z-10">{isLogin ? 'Enter Lobby' : 'Initialize Account'}</span>
              <motion.div 
                className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" 
              />
            </SharpButton>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({
                  fullName: '',
                  displayName: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
              className="text-white/40 text-xs hover:text-white transition-colors uppercase font-black tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>New Homiie? <span className="text-ludo-yellow">Create Account</span></>
              ) : (
                <>Already a Homiie? <span className="text-ludo-yellow">Login</span></>
              )}
            </button>
          </div>
        </motion.div>

        <div className="mt-8 text-center opacity-20">
          <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-white">Version 1.0.0 • Secured by Homiie Protocol</p>
        </div>
      </div>
    </motion.div>
  );
};
