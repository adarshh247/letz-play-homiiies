import React from 'react';
import { motion } from 'framer-motion';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 bg-ludo-dark overflow-hidden pointer-events-none select-none">
      {/* 1. Dimmed Ludo Board Abstraction */}
      <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center scale-150 rotate-12">
        <div className="grid grid-cols-15 grid-rows-15 w-[800px] h-[800px] border-4 border-white">
          {/* Ludo Layout Construction using CSS Grid simulation */}
          {/* Top Left Red */}
          <div className="bg-ludo-red absolute top-0 left-0 w-[40%] h-[40%] border-r-4 border-b-4 border-white flex items-center justify-center">
             <div className="w-1/2 h-1/2 bg-ludo-dark rounded-none rotate-45" />
          </div>
          {/* Top Right Green */}
          <div className="bg-ludo-green absolute top-0 right-0 w-[40%] h-[40%] border-l-4 border-b-4 border-white flex items-center justify-center">
             <div className="w-1/2 h-1/2 bg-ludo-dark rounded-none rotate-45" />
          </div>
          {/* Bottom Left Blue */}
          <div className="bg-ludo-blue absolute bottom-0 left-0 w-[40%] h-[40%] border-r-4 border-t-4 border-white flex items-center justify-center">
             <div className="w-1/2 h-1/2 bg-ludo-dark rounded-none rotate-45" />
          </div>
          {/* Bottom Right Yellow */}
          <div className="bg-ludo-yellow absolute bottom-0 right-0 w-[40%] h-[40%] border-l-4 border-t-4 border-white flex items-center justify-center">
             <div className="w-1/2 h-1/2 bg-ludo-dark rounded-none rotate-45" />
          </div>
          
          {/* Center Path */}
          <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border-4 border-white bg-ludo-dark">
             <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-ludo-red via-ludo-green to-ludo-yellow opacity-20" />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Dots Pattern */}
      <div className="absolute inset-0 opacity-[0.08]" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* 3. Waves / Geometric Lines */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <motion.path 
          d="M0,500 Q200,400 400,500 T800,500" 
          fill="none" 
          stroke="white" 
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
        />
         <motion.path 
          d="M0,600 Q200,700 400,600 T800,600" 
          fill="none" 
          stroke="white" 
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 7, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
        />
      </svg>
      
      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-ludo-red/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-ludo-blue/20 blur-[120px]" />
    </div>
  );
};