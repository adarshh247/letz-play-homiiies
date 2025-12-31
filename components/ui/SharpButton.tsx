
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface SharpButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const SharpButton: React.FC<SharpButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  icon,
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 font-black text-sm uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-2 select-none overflow-hidden rounded-none";
  
  const variants = {
    primary: "bg-white text-ludo-dark border border-white hover:bg-ludo-yellow hover:border-ludo-yellow hover:text-black shadow-[4px_4px_0px_rgba(255,255,255,0.1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    secondary: "bg-ludo-dark text-white border border-white/20 hover:border-white hover:bg-white/5",
    accent: "bg-ludo-red text-white border border-ludo-red hover:bg-red-600 hover:border-red-600 shadow-[4px_4px_0px_rgba(255,71,87,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    outline: "bg-transparent text-white border border-white/10 hover:border-white/30 hover:bg-white/5",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="relative z-10">{children}</span>
      {/* Precision corner marks */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-current opacity-40" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-current opacity-40" />
    </motion.button>
  );
};
