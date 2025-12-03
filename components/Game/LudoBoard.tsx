import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { Star, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { PlayerState, PlayerColor } from '../../types';
import { Pawn } from './Pawn';
import { getPawnCoordinates } from './gameUtils';

interface LudoBoardProps {
  players?: PlayerState[];
  currentTurn?: PlayerColor;
  onPawnClick?: (playerId: string, pawnId: string) => void;
  validMovePawns?: string[]; // List of pawn IDs that can currently move
  onUnlockSecret?: () => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({ 
  players = [], 
  currentTurn, 
  onPawnClick,
  validMovePawns = [],
  onUnlockSecret
}) => {
  
  // Secret DIY Unlock Logic
  const secretClickCount = useRef(0);
  const secretClickTimeout = useRef<any>(null);

  const handleSecretClick = () => {
    secretClickCount.current += 1;
    
    if (secretClickTimeout.current) clearTimeout(secretClickTimeout.current);
    
    // Reset count if user stops clicking for 1 second
    secretClickTimeout.current = setTimeout(() => {
        secretClickCount.current = 0;
    }, 1000);

    if (secretClickCount.current >= 7) {
        if (onUnlockSecret) onUnlockSecret();
        secretClickCount.current = 0;
    }
  };

  // Render Pawns logic for Paths (Board Cells)
  const pawnsByCell: Record<string, { pawn: any, player: PlayerState }[]> = {};

  players.forEach(player => {
    player.pawns.forEach((pawn, index) => {
      // Only map pawns that are NOT in base (-1)
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

    // If multiple pawns, scale them down or grid them
    return (
      <div className={clsx(
        "absolute inset-0 flex items-center justify-center pointer-events-none z-10",
        cellPawns.length > 1 ? "grid grid-cols-2 p-0.5 gap-0.5" : "p-1"
      )}>
        {cellPawns.map(({ pawn, player }) => {
           // Can this pawn be moved by the current human user?
           const isMovable = validMovePawns.includes(pawn.id);
           const isInteractive = isMovable && player.color === currentTurn; 
           const isHome = pawn.location === 99;

           return (
             <div key={pawn.id} className={clsx("pointer-events-auto flex items-center justify-center w-full h-full")}>
               <Pawn 
                 color={player.color} 
                 id={pawn.id}
                 isClickable={isInteractive}
                 onClick={() => onPawnClick && onPawnClick(player.id, pawn.id)} 
                 pulse={isMovable}
                 size={isHome ? 'small' : 'normal'}
               />
             </div>
           );
        })}
      </div>
    );
  };

  const getCellData = (x: number, y: number) => {
    // 1. BASES (6x6 Corners)
    if (x < 6 && y < 6) return { type: 'BASE', color: 'red', id: 'base-red' }; // Top Left
    if (x > 8 && y < 6) return { type: 'BASE', color: 'green', id: 'base-green' }; // Top Right
    if (x < 6 && y > 8) return { type: 'BASE', color: 'blue', id: 'base-blue' }; // Bottom Left
    if (x > 8 && y > 8) return { type: 'BASE', color: 'yellow', id: 'base-yellow' }; // Bottom Right

    // 2. CENTER (3x3 Middle)
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return { type: 'CENTER' };

    // 3. PATHS
    // Left Arm (Rows 6-8, Cols 0-5)
    if (y >= 6 && y <= 8 && x < 6) {
      if (y === 7 && x > 0) return { type: 'PATH_HOME', color: 'red' }; // Home Stretch
      if (y === 6 && x === 1) return { type: 'START', color: 'red' }; // Red Start
      if (y === 8 && x === 2) return { type: 'SAFE' }; // Globe/Star
      return { type: 'PATH' };
    }

    // Right Arm (Rows 6-8, Cols 9-14)
    if (y >= 6 && y <= 8 && x > 8) {
      if (y === 7 && x < 14) return { type: 'PATH_HOME', color: 'yellow' }; // Home Stretch
      if (y === 8 && x === 13) return { type: 'START', color: 'yellow' }; // Yellow Start
      if (y === 6 && x === 12) return { type: 'SAFE' }; // Globe/Star
      return { type: 'PATH' };
    }

    // Top Arm (Rows 0-5, Cols 6-8)
    if (x >= 6 && x <= 8 && y < 6) {
      if (x === 7 && y > 0) return { type: 'PATH_HOME', color: 'green' }; // Home Stretch
      if (x === 8 && y === 1) return { type: 'START', color: 'green' }; // Green Start
      if (x === 6 && y === 2) return { type: 'SAFE' }; // Globe/Star
      return { type: 'PATH' };
    }

    // Bottom Arm (Rows 9-14, Cols 6-8)
    if (x >= 6 && x <= 8 && y > 8) {
      if (x === 7 && y < 14) return { type: 'PATH_HOME', color: 'blue' }; // Home Stretch
      if (x === 6 && y === 13) return { type: 'START', color: 'blue' }; // Blue Start
      if (x === 8 && y === 12) return { type: 'SAFE' }; // Globe/Star
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

        // Handle Base Rendering (Span 6x6)
        if (data.type === 'BASE') {
          if (!renderedBases.has(data.id)) {
            renderedBases.add(data.id);
            
            const basePlayer = players.find(p => p.color === data.color);

            cells.push(
              <div key={key} className={clsx(
                "col-span-6 row-span-6 border-[6px] border-ludo-dark relative z-0",
                data.color === 'red' ? 'bg-ludo-red' :
                data.color === 'green' ? 'bg-ludo-green' :
                data.color === 'blue' ? 'bg-ludo-blue' : 'bg-ludo-yellow'
              )}>
                <div className="absolute inset-4 bg-white shadow-inner flex flex-wrap">
                   {/* 4 Slots for Base Pawns */}
                   <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4 p-2">
                      {[0, 1, 2, 3].map((slotIdx) => {
                         // FIXED: Access pawn directly by index to prevent visual shifting
                         // when other pawns leave the base.
                         const pawn = basePlayer?.pawns[slotIdx];
                         const isInBase = pawn?.location === -1;
                         
                         const isMovable = pawn && isInBase && validMovePawns.includes(pawn.id);
                         const isInteractive = isMovable && data.color === currentTurn;

                         return (
                           <div key={slotIdx} className={clsx(
                             "rounded-full border-[4px] border-black/5 shadow-sm flex items-center justify-center relative p-4", // Added padding to reduce pawn size in base slightly
                             data.color === 'red' ? 'bg-ludo-red' :
                             data.color === 'green' ? 'bg-ludo-green' :
                             data.color === 'blue' ? 'bg-ludo-blue' : 'bg-ludo-yellow'
                           )}>
                              <div className="w-1/2 h-1/2 bg-white/30 rounded-full" />
                              {/* Pawn Render - Only if still in base */}
                              {pawn && isInBase && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
                                   <Pawn 
                                     color={data.color as PlayerColor} 
                                     id={pawn.id}
                                     isClickable={isInteractive}
                                     onClick={() => onPawnClick && onPawnClick(basePlayer.id, pawn.id)} 
                                     pulse={isMovable}
                                   />
                                </div>
                              )}
                           </div>
                         )
                      })}
                   </div>
                </div>
              </div>
            );
          }
          continue;
        }

        if (data.type === 'CENTER') {
           if (x === 6 && y === 6) {
             cells.push(
               <div 
                  key={key} 
                  onClick={handleSecretClick}
                  className="col-span-3 row-span-3 bg-ludo-dark relative overflow-hidden border-[6px] border-ludo-dark active:scale-[0.98] transition-transform"
               >
                  <div className="absolute top-0 left-0 w-full h-full bg-ludo-red" style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-ludo-green" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-ludo-yellow" style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-ludo-blue" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}></div>
                  
                  {/* Pawns in Home */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                      {players.flatMap(p => p.pawns.filter(pawn => pawn.location === 99).map(pawn => (
                          <div key={pawn.id} className="flex items-center justify-center">
                             <Pawn color={p.color} id={pawn.id} size="small" />
                          </div>
                      )))}
                    </div>
                  </div>
               </div>
             )
           }
           continue;
        }

        // Regular Path Cells
        let bgClass = "bg-white";
        let content = null;
        let borderClass = "border-[0.5px] border-ludo-dark/20";
        
        if (data.type === 'PATH_HOME') {
           if (data.color === 'red') bgClass = "bg-ludo-red";
           if (data.color === 'green') bgClass = "bg-ludo-green";
           if (data.color === 'blue') bgClass = "bg-ludo-blue";
           if (data.color === 'yellow') bgClass = "bg-ludo-yellow";
        }
        
        if (data.type === 'START') {
           if (data.color === 'red') bgClass = "bg-ludo-red";
           if (data.color === 'green') bgClass = "bg-ludo-green";
           if (data.color === 'blue') bgClass = "bg-ludo-blue";
           if (data.color === 'yellow') bgClass = "bg-ludo-yellow";
           content = <ArrowRight className="text-white rotate-0 opacity-50" size={16} strokeWidth={3} />; // Default
           if (data.color === 'green') content = <ArrowDown className="text-white opacity-50" size={16} strokeWidth={3} />;
           if (data.color === 'yellow') content = <ArrowLeft className="text-white opacity-50" size={16} strokeWidth={3} />;
           if (data.color === 'blue') content = <ArrowUp className="text-white opacity-50" size={16} strokeWidth={3} />;
        }

        if (data.type === 'SAFE') {
           content = <Star className="text-ludo-dark/20 fill-ludo-dark/5" size={18} />;
           bgClass = "bg-gray-100";
        }

        cells.push(
          <div key={key} className={clsx(
            "relative flex items-center justify-center w-full h-full",
            bgClass,
            borderClass
          )}>
            {content}
            {getCellContent(x, y)}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="aspect-square w-full h-full max-w-[650px] bg-ludo-dark p-1 shadow-2xl relative select-none rounded-none">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-white border border-ludo-dark">
        {renderCells()}
      </div>
    </div>
  );
};