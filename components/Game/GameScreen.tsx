import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { LudoBoard } from './LudoBoard';
import { Dice } from './Dice';
import { SharpButton } from '../ui/SharpButton';
import { PlayerState, PlayerColor } from '../../types';
import { isValidMove, SAFE_INDICES, PLAYER_START_OFFSETS } from './gameUtils';
import { X, Trophy } from 'lucide-react';

interface GameScreenProps {
  onExit: () => void;
  vsComputer?: boolean;
}

const TURN_DURATION = 15000; // 15 seconds

export const GameScreen: React.FC<GameScreenProps> = ({ onExit, vsComputer = false }) => {
  // --- Game State ---
  const [players, setPlayers] = useState<PlayerState[]>([
    { 
      id: 'p1', name: 'You', color: 'red', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
      isBot: false, 
      pawns: [0,1,2,3].map(i => ({ id: `red-${i}`, color: 'red', location: -1 })) 
    },
    { 
      id: 'p2', name: vsComputer ? 'Bot Green' : 'Player 2', color: 'green', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `green-${i}`, color: 'green', location: -1 })) 
    },
    { 
      id: 'p3', name: vsComputer ? 'Bot Yellow' : 'Player 3', color: 'yellow', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `yellow-${i}`, color: 'yellow', location: -1 })) 
    },
    { 
      id: 'p4', name: vsComputer ? 'Bot Blue' : 'Player 4', color: 'blue', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `blue-${i}`, color: 'blue', location: -1 })) 
    },
  ]);

  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [validMovePawns, setValidMovePawns] = useState<string[]>([]);
  const [winner, setWinner] = useState<PlayerState | null>(null);
  const [turnTimerKey, setTurnTimerKey] = useState(0);
  const [isMovingPawn, setIsMovingPawn] = useState(false);

  const currentPlayer = players[turnIndex];

  // --- Core Game Logic ---
  const nextTurn = useCallback(() => {
    setHasRolled(false);
    setValidMovePawns([]);
    setTurnTimerKey(prev => prev + 1);
    setIsMovingPawn(false);
    
    if (diceValue === 6 && !winner) {
       return; // Bonus roll
    }
    setTurnIndex(prev => (prev + 1) % 4);
  }, [diceValue, winner]);

  const handleRoll = useCallback(() => {
    if (isRolling || hasRolled || winner || isMovingPawn) return;

    setIsRolling(true);
    
    setTimeout(() => {
      const rolledValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(rolledValue);
      setIsRolling(false);
      setHasRolled(true);

      const moves: string[] = [];
      currentPlayer.pawns.forEach(pawn => {
        if (isValidMove(pawn.location, rolledValue)) {
          moves.push(pawn.id);
        }
      });

      setValidMovePawns(moves);

      if (moves.length === 0) {
        setTimeout(nextTurn, 1000);
      }
    }, 600);
  }, [currentPlayer, isRolling, hasRolled, winner, isMovingPawn, nextTurn]);

  const handlePawnClick = (playerId: string, pawnId: string) => {
    if (!hasRolled || playerId !== currentPlayer.id || !validMovePawns.includes(pawnId) || isMovingPawn) return;
    animateMoveSequence(pawnId);
  };

  // Internal helper to just set location instantly (used inside loop)
  const setPawnLocation = (pawnId: string, newLoc: number) => {
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.id !== currentPlayer.id) return player;
        return {
          ...player,
          pawns: player.pawns.map(pawn => 
            pawn.id === pawnId ? { ...pawn, location: newLoc } : pawn
          )
        };
      });
    });
  };

  const animateMoveSequence = useCallback(async (pawnId: string) => {
    setIsMovingPawn(true);
    const player = players.find(p => p.id === currentPlayer.id);
    const pawn = player?.pawns.find(p => p.id === pawnId);
    if (!player || !pawn) return;

    const currentLoc = pawn.location;
    const stepsToMove = (currentLoc === -1) ? 1 : diceValue;

    // STEP BY STEP ANIMATION
    for (let i = 1; i <= stepsToMove; i++) {
        const nextLoc = (currentLoc === -1) ? 0 : (currentLoc + i);
        
        // Update state to render pawn at next location
        setPawnLocation(pawnId, nextLoc);
        
        // Wait for animation to visually complete before next step
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased hopping speed to 300ms for smoothness
    }

    // Final Logic (Captures, Win) after animation finishes
    const finalLocation = (currentLoc === -1) ? 0 : (currentLoc + diceValue);
    
    // Check Captures
    let captured = false;
    if (finalLocation < 51) { 
        const offset = PLAYER_START_OFFSETS[player.color];
        const globalPos = (offset + finalLocation) % 52;
        const isSafe = SAFE_INDICES.includes(globalPos);

        if (!isSafe) {
           // We need to access the LATEST state here for opponents
           setPlayers(prev => {
              const newPlayers = [...prev];
              newPlayers.forEach((opp, oppIdx) => {
                  if (opp.id !== player.id) {
                      opp.pawns.forEach((oppPawn, oppPawnIdx) => {
                          const oppOffset = PLAYER_START_OFFSETS[opp.color];
                          const oppGlobal = oppPawn.location !== -1 && oppPawn.location < 51 
                              ? (oppOffset + oppPawn.location) % 52 
                              : -999;
                          
                          if (globalPos === oppGlobal) {
                              newPlayers[oppIdx].pawns[oppPawnIdx].location = -1; // Send to base
                              captured = true;
                          }
                      });
                  }
              });
              // Check Win
              const currentPlayerRef = newPlayers.find(p => p.id === player.id);
              if (currentPlayerRef && currentPlayerRef.pawns.every(p => p.location === 99)) {
                 setWinner(currentPlayerRef);
              }
              return newPlayers;
           });
        }
    } else {
        // Check Win if landed on 99
        setPlayers(prev => {
             const newPlayers = [...prev];
             const currentPlayerRef = newPlayers.find(p => p.id === player.id);
             if (currentPlayerRef && currentPlayerRef.pawns.every(p => p.location === 99)) {
                 setWinner(currentPlayerRef);
             }
             return newPlayers;
        });
    }
    
    // Delay before next turn to let player see the result
    setTimeout(() => {
       if (!winner) nextTurn(); // Only next turn if no winner yet (though effect handles winner)
    }, 500);

  }, [currentPlayer, diceValue, nextTurn, winner]);

  // Turn Timer
  useEffect(() => {
    if (winner) return;
    const timer = setTimeout(() => {
       if (!hasRolled && !isRolling && !isMovingPawn) {
          handleRoll();
       } else if (hasRolled && !isRolling && !isMovingPawn) {
          if (validMovePawns.length > 0) {
             animateMoveSequence(validMovePawns[0]);
          } else {
             nextTurn();
          }
       }
    }, TURN_DURATION);
    return () => clearTimeout(timer);
  }, [turnTimerKey, hasRolled, isRolling, validMovePawns, handleRoll, animateMoveSequence, nextTurn, winner, isMovingPawn]);

  // Bot Turn
  useEffect(() => {
    if (currentPlayer.isBot && !winner) {
      if (!isRolling && !hasRolled && !isMovingPawn) {
        const rollDelay = setTimeout(handleRoll, 1000);
        return () => clearTimeout(rollDelay);
      } else if (hasRolled && !isRolling && !isMovingPawn) {
        const moveDelay = setTimeout(() => {
          if (validMovePawns.length > 0) {
            const basePawn = validMovePawns.find(id => {
                const p = currentPlayer.pawns.find(p => p.id === id);
                return p?.location === -1;
            });
            const moveId = basePawn || validMovePawns[Math.floor(Math.random() * validMovePawns.length)];
            animateMoveSequence(moveId);
          }
        }, 1000);
        return () => clearTimeout(moveDelay);
      }
    }
  }, [currentPlayer, isRolling, hasRolled, validMovePawns, handleRoll, animateMoveSequence, winner, isMovingPawn]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ludo-dark overflow-hidden">
       
       {/* Top Bar / Header */}
       <div className="flex-none p-4 flex justify-between items-center z-40 bg-ludo-dark/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
             <div className="font-black text-xl tracking-tighter text-white">HOMIIES<span className="text-ludo-red">.</span></div>
          </div>
          <SharpButton variant="secondary" className="px-3 py-1 text-xs h-8" onClick={onExit} icon={<X size={14} />}>
            LEAVE
          </SharpButton>
       </div>

       {/* Main Game Area */}
       <div className="flex-1 relative flex flex-col md:flex-row items-center justify-center p-2 gap-2 md:gap-8">
          
          {/* Winner Overlay */}
          <AnimatePresence>
            {winner && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-8"
               >
                  <Trophy size={80} className="text-ludo-yellow mb-6 animate-bounce" />
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-2 text-center">{winner.name} Wins!</h2>
                  <SharpButton onClick={onExit} className="mt-8">Back to Lobby</SharpButton>
               </motion.div>
            )}
          </AnimatePresence>

          {/* MOBILE: Top Row Players (Red & Green) */}
          <div className="flex md:hidden w-full gap-2 justify-between max-w-[500px]">
             <PlayerCard 
                player={players[0]} 
                active={turnIndex === 0} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
                compact
                align="left"
             />
             <PlayerCard 
                player={players[1]} 
                active={turnIndex === 1} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
                compact
                align="right"
             />
          </div>

          {/* DESKTOP: Left Column (Red & Blue) */}
          <div className="hidden md:flex flex-col gap-16 h-full justify-center w-64">
             <PlayerCard 
                player={players[0]} 
                active={turnIndex === 0} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
             />
             <PlayerCard 
                player={players[3]} 
                active={turnIndex === 3} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
             />
          </div>

          {/* GAME BOARD */}
          <div className="flex-shrink-0 w-full max-w-[400px] md:max-w-[600px] aspect-square relative z-10">
             <div className="absolute inset-0 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
               <LudoBoard 
                  players={players} 
                  currentTurn={currentPlayer.color}
                  onPawnClick={handlePawnClick}
                  validMovePawns={validMovePawns}
               />
             </div>
          </div>

          {/* DESKTOP: Right Column (Green & Yellow) */}
          <div className="hidden md:flex flex-col gap-16 h-full justify-center w-64">
             <PlayerCard 
                player={players[1]} 
                active={turnIndex === 1} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
             />
             <PlayerCard 
                player={players[2]} 
                active={turnIndex === 2} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
             />
          </div>

          {/* MOBILE: Bottom Row Players (Blue & Yellow) */}
          <div className="flex md:hidden w-full gap-2 justify-between max-w-[500px]">
             <PlayerCard 
                player={players[3]} 
                active={turnIndex === 3} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
                compact
                align="left"
             />
             <PlayerCard 
                player={players[2]} 
                active={turnIndex === 2} 
                timerKey={turnTimerKey} 
                diceValue={diceValue}
                isRolling={isRolling}
                hasRolled={hasRolled}
                onRoll={handleRoll}
                compact
                align="right"
             />
          </div>
       </div>

       {/* Mobile Status Bar */}
       <div className="md:hidden text-center p-2 text-white/30 text-[10px] font-mono uppercase">
          {currentPlayer.isBot ? "Opponent Thinking..." : (turnIndex === 0 ? "Your Turn" : `${currentPlayer.name}'s Turn`)}
       </div>
    </div>
  );
};

interface PlayerCardProps {
   player: PlayerState;
   active: boolean;
   timerKey: number;
   diceValue: number;
   isRolling: boolean;
   hasRolled: boolean;
   onRoll: () => void;
   compact?: boolean;
   align?: 'left' | 'right';
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
   player, active, timerKey, diceValue, isRolling, hasRolled, onRoll, compact, align 
}) => {
  const colorStyles = {
    red: 'border-ludo-red text-ludo-red shadow-red-500/20',
    green: 'border-ludo-green text-ludo-green shadow-green-500/20',
    blue: 'border-ludo-blue text-ludo-blue shadow-blue-500/20',
    yellow: 'border-ludo-yellow text-ludo-yellow shadow-yellow-500/20',
  };

  const bgStyles = {
    red: 'bg-ludo-red',
    green: 'bg-ludo-green',
    blue: 'bg-ludo-blue',
    yellow: 'bg-ludo-yellow',
  };

  const diceColors = {
     red: '#FF4757', green: '#2ED573', blue: '#1E90FF', yellow: '#FFA502'
  };

  return (
    <div className={clsx(
       "relative transition-all duration-300 flex items-center bg-ludo-dark border-2 backdrop-blur-sm shadow-lg",
       active ? `${colorStyles[player.color]} scale-105 z-30 ring-2 ring-white/10` : "border-white/10 text-white/30 grayscale opacity-80",
       compact ? "flex-1 min-w-0 p-2 gap-2 h-20 rounded-lg" : "w-full p-4 gap-4 h-32 rounded-xl",
       align === 'right' && compact ? "flex-row-reverse text-right" : ""
    )}>
       {/* Turn Indicator */}
       {active && (
          <div className={clsx(
             "absolute -top-3 px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-md",
             compact ? (align === 'right' ? "right-2" : "left-2") : "left-4"
          )}>
             Your Turn
          </div>
       )}

       {/* Avatar */}
       <div className={clsx(
          "relative border-2 border-current rounded-full overflow-hidden flex-shrink-0 bg-white/5",
          compact ? "w-10 h-10" : "w-16 h-16"
       )}>
          <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          {player.isBot && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-[8px]">BOT</div>}
       </div>

       {/* Info */}
       <div className={clsx("flex-1 min-w-0 flex flex-col justify-center", compact && align === 'right' ? "items-end" : "items-start")}>
          <div className={clsx("font-bold truncate leading-tight", compact ? "text-xs" : "text-lg")}>
             {player.name}
          </div>
          {!compact && (
             <div className="flex gap-2 mt-1 opacity-70">
                <div className="text-xs bg-white/5 px-1.5 py-0.5 rounded">🏠 {player.pawns.filter(p=>p.location===-1).length}</div>
                <div className="text-xs bg-white/5 px-1.5 py-0.5 rounded">👑 {player.pawns.filter(p=>p.location===99).length}</div>
             </div>
          )}
       </div>

       {/* Active Dice Control */}
       <div className={clsx(
          "relative flex items-center justify-center transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
       )}>
          {active && (
             <div className="relative">
                <Dice 
                   value={diceValue} 
                   rolling={isRolling} 
                   onRoll={onRoll} 
                   disabled={player.isBot || hasRolled} 
                   color={diceColors[player.color]}
                   className={compact ? "w-12 h-12" : "w-16 h-16"}
                />
                {!player.isBot && !hasRolled && !isRolling && (
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-wider animate-bounce text-white">
                      Tap Me
                   </div>
                )}
             </div>
          )}
       </div>

       {/* Timer Progress Bar */}
       {active && (
          <motion.div 
             key={timerKey}
             className={clsx("absolute bottom-0 left-0 h-1 z-10", bgStyles[player.color])}
             initial={{ width: "100%" }}
             animate={{ width: "0%" }}
             transition={{ duration: TURN_DURATION / 1000, ease: "linear" }}
          />
       )}
    </div>
  );
};