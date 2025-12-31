
import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { Star, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { PlayerState, PlayerColor } from '../../types';
import { Pawn } from './Pawn';
import { getPawnCoordinates } from './gameUtils';
import { motion } from 'framer-motion';

interface LudoBoardProps {
  players?: PlayerState[];
  currentTurn?: PlayerColor;
  onPawnClick?: (playerId: string, pawnId: string) => void;
  validMovePawns?: string[];
  onUnlockSecret?: () => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({ 
  players = [], 
  currentTurn, 
  onPawnClick,
  validMovePawns = [],
  onUnlockSecret
}) => {
  const secretClickCount = useRef(0);
  const secretClickTimeout = useRef<any>(null);

  const handleSecretClick = () => {
    secretClickCount.current += 1;
    if (secretClickTimeout.current) clearTimeout(secretClickTimeout.current);
    secretClickTimeout.current = setTimeout(() => { secretClickCount.current = 0; }, 1000);
    if (secretClickCount.current >= 7) {
        if (onUnlockSecret) onUnlockSecret();
        secretClickCount.current = 0;
    }
  };

  const pawnsByCell: Record<string, { pawn: any, player: PlayerState }[]> = {};
  players.forEach(player => {
    player.pawns.forEach(pawn => {
      if (pawn.location !== -1) {
        const [x, y] = getPawnCoordinates(player.color, pawn.location, pawn.id);
        const key = `${x}-${y}`;
        if (!pawnsByCell[key]) pawnsByCell[key] = [];
        pawnsByCell[key].push({ pawn, player });
      }
    });
  });

  const getCellContent = (x: number, y: number) => {
    const key = `${x}-${y}`;
    const cellPawns = pawnsByCell[key] || [];
    if (cellPawns.length === 0) return null;
    return (
      <div className={clsx("absolute inset-0 flex items-center justify-center pointer-events-none z-10", cellPawns.length > 1 ? "grid grid-cols-2 p-0.5 gap-0.5" : "p-1")}>
        {cellPawns.map(({ pawn, player }) => (
           <div key={pawn.id} className="pointer-events-auto flex items-center justify-center w-full h-full">
             <Pawn color={player.color} id={pawn.id} isClickable={validMovePawns.includes(pawn.id) && player.color === currentTurn} onClick={() => onPawnClick && onPawnClick(player.id, pawn.id)} pulse={validMovePawns.includes(pawn.id)} size={pawn.location === 99 ? 'small' : 'normal'} />
           </div>
        ))}
      </div>
    );
  };

  const getCellData = (x: number, y: number) => {
    if (x < 6 && y < 6) return { type: 'BASE', color: 'red', id: 'base-red' };
    if (x > 8 && y < 6) return { type: 'BASE', color: 'blue', id: 'base-blue' }; 
    if (x < 6 && y > 8) return { type: 'BASE', color: 'green', id: 'base-green' }; 
    if (x > 8 && y > 8) return { type: 'BASE', color: 'yellow', id: 'base-yellow' };
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return { type: 'CENTER' };
    if (y >= 6 && y <= 8 && x < 6) {
      if (y === 7 && x > 0) return { type: 'PATH_HOME', color: 'red' };
      if (y === 6 && x === 1) return { type: 'START', color: 'red' };
      if (y === 8 && x === 2) return { type: 'SAFE' };
      return { type: 'PATH' };
    }
    if (y >= 6 && y <= 8 && x > 8) {
      if (y === 7 && x < 14) return { type: 'PATH_HOME', color: 'yellow' };
      if (y === 8 && x === 13) return { type: 'START', color: 'yellow' };
      if (y === 6 && x === 12) return { type: 'SAFE' };
      return { type: 'PATH' };
    }
    if (x >= 6 && x <= 8 && y < 6) {
      if (x === 7 && y > 0) return { type: 'PATH_HOME', color: 'blue' }; 
      if (x === 8 && y === 1) return { type: 'START', color: 'blue' }; 
      if (x === 6 && y === 2) return { type: 'SAFE' };
      return { type: 'PATH' };
    }
    if (x >= 6 && x <= 8 && y > 8) {
      if (x === 7 && y < 14) return { type: 'PATH_HOME', color: 'green' }; 
      if (x === 6 && y === 13) return { type: 'START', color: 'green' }; 
      if (x === 8 && y === 12) return { type: 'SAFE' };
      return { type: 'PATH' };
    }
    return { type: 'EMPTY' };
  };

  const renderCells = () => {
    const cells = [];
    const renderedBases = new Set();
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const data = getCellData(x, y);
        const key = `${x}-${y}`;
        if (data.type === 'BASE') {
          if (!renderedBases.has(data.id)) {
            renderedBases.add(data.id);
            const basePlayer = players.find(p => p.color === data.color);
            cells.push(
              <div key={key} className={clsx("col-span-6 row-span-6 border-[6px] border-ludo-dark relative z-0 rounded-[2.5rem] shadow-inner transition-transform duration-500", data.color === 'red' ? 'bg-ludo-red' : data.color === 'green' ? 'bg-ludo-green' : data.color === 'blue' ? 'bg-ludo-blue' : 'bg-ludo-yellow')}>
                <div className="absolute inset-4 bg-white/90 shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)] grid grid-cols-2 grid-rows-2 gap-4 p-5 rounded-[2rem]">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const pawn = basePlayer?.pawns[slotIdx];
                    const isInBase = pawn?.location === -1;
                    return (
                      <div key={slotIdx} className={clsx("flex items-center justify-center relative rounded-full border border-black/5", data.color === 'red' ? 'bg-ludo-red/10' : data.color === 'green' ? 'bg-ludo-green/10' : data.color === 'blue' ? 'bg-ludo-blue/10' : 'bg-ludo-yellow/10')}>
                        <div className="w-1/2 h-1/2 bg-white/40 rounded-full blur-[2px]" />
                        {pawn && isInBase && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
                             <Pawn color={data.color as PlayerColor} id={pawn.id} isClickable={isInBase && validMovePawns.includes(pawn.id) && data.color === currentTurn} onClick={() => onPawnClick && onPawnClick(basePlayer.id, pawn.id)} pulse={isInBase && validMovePawns.includes(pawn.id)} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          }
          continue;
        }
        if (data.type === 'CENTER') {
           if (x === 6 && y === 6) {
             cells.push(
               <div key={key} onClick={handleSecretClick} className="col-span-3 row-span-3 bg-ludo-dark relative border-[6px] border-ludo-dark active:scale-[0.98] transition-transform shadow-2xl">
                  <div className="absolute inset-0 bg-ludo-red" style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}></div>
                  <div className="absolute inset-0 bg-ludo-blue" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}></div>
                  <div className="absolute inset-0 bg-ludo-yellow" style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}></div>
                  <div className="absolute inset-0 bg-ludo-green" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}></div>
                  <div className="absolute inset-[20%] border border-white/20 rounded-full animate-spin-slow"></div>
               </div>
             )
           }
           continue;
        }
        let bgClass = "bg-white";
        let content = null;
        if (data.type === 'PATH_HOME') bgClass = data.color === 'red' ? 'bg-ludo-red' : data.color === 'green' ? 'bg-ludo-green' : data.color === 'blue' ? 'bg-ludo-blue' : 'bg-ludo-yellow';
        if (data.type === 'START') {
           bgClass = data.color === 'red' ? 'bg-ludo-red' : data.color === 'green' ? 'bg-ludo-green' : data.color === 'blue' ? 'bg-ludo-blue' : 'bg-ludo-yellow';
           if (data.color === 'red') content = <ArrowRight className="text-white opacity-60" size={14} />;
           if (data.color === 'blue') content = <ArrowDown className="text-white opacity-60" size={14} />; 
           if (data.color === 'yellow') content = <ArrowLeft className="text-white opacity-60" size={14} />;
           if (data.color === 'green') content = <ArrowUp className="text-white opacity-60" size={14} />; 
        }
        if (data.type === 'SAFE') {
           content = <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}><Star className="text-ludo-dark/20 fill-ludo-dark/10" size={16} /></motion.div>;
           bgClass = "bg-gray-100";
        }
        cells.push(
          <div key={key} className={clsx("relative flex items-center justify-center w-full h-full border-[0.5px] border-ludo-dark/10 transition-colors duration-300", bgClass)}>
            {content}
            {getCellContent(x, y)}
            {data.type === 'PATH_HOME' && <div className="absolute inset-0 bg-white/10" />}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="aspect-square w-full h-full max-w-[650px] bg-ludo-dark p-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative select-none rounded-[4rem]">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-white border-4 border-ludo-dark rounded-[3rem] overflow-hidden shadow-2xl">
        {renderCells()}
      </div>
    </div>
  );
};
