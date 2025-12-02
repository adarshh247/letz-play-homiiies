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
  const baseStyles = "relative px-8 py-4 font-bold text-lg uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-3 rounded-none select-none";
  
  const variants = {
    primary: "bg-white text-ludo-dark border-2 border-white hover:bg-ludo-yellow hover:border-ludo-yellow hover:text-black",
    secondary: "bg-ludo-dark text-white border-2 border-white/20 hover:border-white hover:bg-white/5",
    accent: "bg-ludo-red text-white border-2 border-ludo-red hover:bg-red-600 hover:border-red-600",
    outline: "bg-transparent text-white border-2 border-white/40 hover:border-white hover:bg-white/10",
    ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 1 }}
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
      {/* Corner accents for that sharp tech look */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
};