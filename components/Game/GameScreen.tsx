
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { LudoBoard } from './LudoBoard';
import { Dice } from './Dice';
import { DIYControl } from './DIYControl';
import { SharpButton } from '../ui/SharpButton';
import { PlayerState, PlayerColor, User } from '../../types';
import { isValidMove, SAFE_INDICES, PLAYER_START_OFFSETS } from './gameUtils';
import { X, Trophy, Wand2, Crown, Sparkles, Hash } from 'lucide-react';

interface GameScreenProps {
  user: User;
  onExit: () => void;
  vsComputer?: boolean;
}

const TURN_DURATION = 15000; // 15 seconds
const MOVE_STEP_DELAY = 180; // Snappier movement

export const GameScreen: React.FC<GameScreenProps> = ({ user, onExit, vsComputer = false }) => {
  // --- Game State ---
  const [players, setPlayers] = useState<PlayerState[]>([
    { 
      id: 'p1', name: user.name, color: 'red', avatarUrl: user.avatarUrl, 
      isBot: false, 
      pawns: [0,1,2,3].map(i => ({ id: `red-${i}`, color: 'red', location: -1 })) 
    },
    { 
      id: 'p2', name: vsComputer ? 'Bot Blue' : 'Player 2', color: 'blue', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `blue-${i}`, color: 'blue', location: -1 })) 
    },
    { 
      id: 'p3', name: vsComputer ? 'Bot Yellow' : 'Player 3', color: 'yellow', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `yellow-${i}`, color: 'yellow', location: -1 })) 
    },
    { 
      id: 'p4', name: vsComputer ? 'Bot Green' : 'Player 4', color: 'green', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 
      isBot: vsComputer, 
      pawns: [0,1,2,3].map(i => ({ id: `green-${i}`, color: 'green', location: -1 })) 
    },
  ]);

  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [validMovePawns, setValidMovePawns] = useState<string[]>([]);
  
  // Game Status
  const [isGameOver, setIsGameOver] = useState(false);
  const [turnTimerKey, setTurnTimerKey] = useState(0);
  const [isMovingPawn, setIsMovingPawn] = useState(false);
  const [pawnCelebration, setPawnCelebration] = useState<{ color: PlayerColor, pawnId: string } | null>(null);

  // --- Secret DIY State ---
  const [diyUnlocked, setDiyUnlocked] = useState(false);
  const [diyActive, setDiyActive] = useState(false);
  const [showDiyPopup, setShowDiyPopup] = useState(false);

  const currentPlayer = players[turnIndex];

  const getFinishedCount = useCallback(() => {
    return players.filter(p => p.rank).length;
  }, [players]);

  const nextTurn = useCallback(() => {
    if (getFinishedCount() >= 3) {
      setIsGameOver(true);
      return;
    }

    setHasRolled(false);
    setValidMovePawns([]);
    setTurnTimerKey(prev => prev + 1);
    setIsMovingPawn(false);
    
    setTurnIndex(prevIndex => {
      let nextIndex = (prevIndex + 1) % 4;
      let loopCount = 0;
      while (players[nextIndex].rank && loopCount < 4) {
        nextIndex = (nextIndex + 1) % 4;
        loopCount++;
      }
      if (loopCount >= 4) return prevIndex;
      if (diceValue === 6 && !players[prevIndex].rank) {
         return prevIndex;
      }
      return nextIndex;
    });
  }, [diceValue, players, getFinishedCount]);

  const finishRoll = useCallback((finalVal: number) => {
    setDiceValue(finalVal);
    setIsRolling(false);
    setHasRolled(true);
    const moves: string[] = [];
    currentPlayer.pawns.forEach(pawn => {
      if (isValidMove(pawn.location, finalVal)) {
        moves.push(pawn.id);
      }
    });
    setValidMovePawns(moves);
    if (moves.length === 0) {
      setTimeout(nextTurn, 1000);
    }
  }, [currentPlayer, nextTurn]);

  const handleRoll = useCallback(() => {
    if (isRolling || hasRolled || isGameOver || isMovingPawn || currentPlayer.rank) return;
    setIsRolling(true);
    
    if (diyActive && !currentPlayer.isBot) {
      setShowDiyPopup(true);
    } else {
      setTimeout(() => {
        finishRoll(Math.floor(Math.random() * 6) + 1);
      }, 600);
    }
  }, [currentPlayer, isRolling, hasRolled, isGameOver, isMovingPawn, diyActive, finishRoll]);

  const handleDiySelect = (value: number) => {
    setShowDiyPopup(false);
    // Add small delay for aesthetic before finishing
    setTimeout(() => finishRoll(value), 400);
  };

  const handlePawnClick = (playerId: string, pawnId: string) => {
    if (!hasRolled || playerId !== currentPlayer.id || !validMovePawns.includes(pawnId) || isMovingPawn) return;
    animateMoveSequence(pawnId);
  };

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

    for (let i = 1; i <= stepsToMove; i++) {
        let nextLoc = (currentLoc === -1) ? 0 : (currentLoc + i);
        if (nextLoc >= 57) {
          nextLoc = 99;
          setPawnLocation(pawnId, nextLoc);
          break;
        }
        setPawnLocation(pawnId, nextLoc);
        await new Promise(resolve => setTimeout(resolve, MOVE_STEP_DELAY));
    }

    let finalLocation = (currentLoc === -1) ? 0 : (currentLoc + diceValue);
    if (finalLocation >= 57) finalLocation = 99;

    setPlayers(prev => {
      const newPlayers = [...prev];
      const currentPlayerIdx = newPlayers.findIndex(p => p.id === player.id);
      if (finalLocation < 51) { 
        const offset = PLAYER_START_OFFSETS[player.color];
        const globalPos = (offset + finalLocation) % 52;
        const isSafe = SAFE_INDICES.includes(globalPos);
        if (!isSafe) {
           newPlayers.forEach((opp, oppIdx) => {
              if (opp.id !== player.id && !opp.rank) {
                  opp.pawns.forEach((oppPawn, oppPawnIdx) => {
                      const oppOffset = PLAYER_START_OFFSETS[opp.color];
                      const oppGlobal = oppPawn.location !== -1 && oppPawn.location < 51 ? (oppOffset + oppPawn.location) % 52 : -999;
                      if (globalPos === oppGlobal) {
                          newPlayers[oppIdx].pawns[oppPawnIdx].location = -1;
                      }
                  });
              }
           });
        }
      }
      if (finalLocation === 99) {
         setPawnCelebration({ color: player.color, pawnId: pawnId });
         setTimeout(() => setPawnCelebration(null), 2500);
      }
      const hasWonNow = newPlayers[currentPlayerIdx].pawns.every(p => p.location === 99);
      if (hasWonNow && !newPlayers[currentPlayerIdx].rank) {
         const finishedCount = newPlayers.filter(p => p.rank).length;
         newPlayers[currentPlayerIdx].rank = finishedCount + 1;
      }
      return newPlayers;
    });

    setTimeout(() => {
        setPlayers(currentPlayers => {
            const finishedCount = currentPlayers.filter(p => p.rank).length;
            if (finishedCount === 3) {
                const loserIdx = currentPlayers.findIndex(p => !p.rank);
                if (loserIdx !== -1) {
                    const finalPlayers = [...currentPlayers];
                    finalPlayers[loserIdx].rank = 4;
                    setIsGameOver(true);
                    return finalPlayers;
                }
            }
            return currentPlayers;
        });
        if (!isGameOver) nextTurn();
    }, 500);
  }, [currentPlayer, diceValue, nextTurn, isGameOver, players]);

  useEffect(() => {
    if (isGameOver || currentPlayer.rank) return;
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
  }, [turnTimerKey, hasRolled, isRolling, validMovePawns, handleRoll, animateMoveSequence, nextTurn, isGameOver, isMovingPawn, diyActive, currentPlayer]);

  useEffect(() => {
    if (currentPlayer.isBot && !isGameOver && !currentPlayer.rank) {
      if (!isRolling && !hasRolled && !isMovingPawn) {
        setTimeout(handleRoll, 1000);
      } else if (hasRolled && !isRolling && !isMovingPawn) {
        setTimeout(() => {
          if (validMovePawns.length > 0) {
            const moveId = validMovePawns[Math.floor(Math.random() * validMovePawns.length)];
            animateMoveSequence(moveId);
          }
        }, 1000);
      }
    }
  }, [currentPlayer, isRolling, hasRolled, validMovePawns, handleRoll, animateMoveSequence, isGameOver, isMovingPawn, diyActive]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ludo-dark overflow-hidden">
       {/* DIY Logic Control Overlay */}
       <AnimatePresence>
         {showDiyPopup && (
           <DIYControl onSelect={handleDiySelect} />
         )}
       </AnimatePresence>

       {/* Top Bar Header */}
       <div className="flex-none p-3 md:p-4 flex justify-between items-center z-40 bg-ludo-dark/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
             <div className="font-black text-lg md:text-xl tracking-tighter text-white uppercase">Homiies<span className="text-ludo-red">.</span></div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {diyUnlocked && (
              <button 
                onClick={() => setDiyActive(!diyActive)}
                className={clsx(
                  "px-2 md:px-3 py-1 border transition-all flex items-center gap-2 font-mono text-[9px] md:text-[10px] font-black",
                  diyActive ? "bg-ludo-red text-white border-ludo-red animate-pulse" : "bg-transparent text-white/30 border-white/10"
                )}
              >
                <Wand2 size={12} />
                <span className="hidden xs:inline">DIY: {diyActive ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <SharpButton variant="secondary" className="px-3 md:px-4 h-7 md:h-8 text-[9px] md:text-[10px]" onClick={onExit} icon={<X size={12} />}>
              Exit
            </SharpButton>
          </div>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 relative flex flex-col items-center justify-center p-3 md:p-6 overflow-y-auto overflow-x-hidden gap-4 md:gap-8">
          <AnimatePresence>
            {pawnCelebration && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5 }}
                className="absolute z-[100] pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-8 rounded-full border border-white/20 shadow-2xl"
              >
                 <Sparkles className="text-ludo-yellow w-12 h-12 mb-2 animate-bounce" />
                 <div className="font-black text-white text-2xl uppercase tracking-tighter italic">PAWN HOME!</div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isGameOver && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 p-6 overflow-y-auto">
                  <Trophy size={48} className="text-ludo-yellow mb-4" />
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-6 md:mb-8 italic uppercase tracking-tighter">Match Ended</h2>
                  <div className="w-full max-w-sm space-y-2">
                    {players.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p) => (
                        <div key={p.id} className={clsx("flex items-center p-3 border border-white/10 gap-4 rounded-xl", p.rank === 1 ? "bg-ludo-yellow/10" : "bg-white/5")}>
                           <div className="font-black text-xl w-6 text-white/50">{p.rank}</div>
                           <div className="w-10 h-10 border border-white/20 rounded-lg overflow-hidden"><img src={p.avatarUrl} className="w-full h-full" /></div>
                           <div className="flex-1 font-bold text-white text-sm uppercase tracking-wider">{p.name}</div>
                        </div>
                    ))}
                  </div>
                  <SharpButton onClick={onExit} className="mt-8 w-full max-w-xs">Return to Lobby</SharpButton>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Top Row Players (Red, Blue) */}
          <div className="flex justify-between w-full max-w-[750px] gap-2 md:gap-8">
             <PlayerTurnBox 
               player={players[0]} active={turnIndex === 0} timerKey={turnTimerKey} diceValue={diceValue} 
               isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="right"
             />
             <PlayerTurnBox 
               player={players[1]} active={turnIndex === 1} timerKey={turnTimerKey} diceValue={diceValue} 
               isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="left"
             />
          </div>

          {/* Center Ludo Board */}
          <div className="flex-shrink-0 w-full max-w-[280px] xs:max-w-[340px] md:max-w-[460px] aspect-square relative z-10">
             <LudoBoard 
               players={players} currentTurn={currentPlayer.color} onPawnClick={handlePawnClick} 
               validMovePawns={validMovePawns} onUnlockSecret={() => setDiyUnlocked(true)} 
             />
          </div>

          {/* Bottom Row Players (Green, Yellow) */}
          <div className="flex justify-between w-full max-w-[750px] gap-2 md:gap-8">
             <PlayerTurnBox 
               player={players[3]} active={turnIndex === 3} timerKey={turnTimerKey} diceValue={diceValue} 
               isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="right"
             />
             <PlayerTurnBox 
               player={players[2]} active={turnIndex === 2} timerKey={turnTimerKey} diceValue={diceValue} 
               isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="left"
             />
          </div>
       </div>
    </div>
  );
};

interface PlayerTurnBoxProps {
   player: PlayerState;
   active: boolean;
   timerKey: number;
   diceValue: number;
   isRolling: boolean;
   hasRolled: boolean;
   onRoll: () => void;
   diceSide: 'left' | 'right';
}

const PlayerTurnBox: React.FC<PlayerTurnBoxProps> = ({ player, active, timerKey, diceValue, isRolling, hasRolled, onRoll, diceSide }) => {
  const colorStyles = { red: 'stroke-ludo-red', green: 'stroke-ludo-green', blue: 'stroke-ludo-blue', yellow: 'stroke-ludo-yellow' };
  const diceColors = { red: '#FF4757', green: '#2ED573', blue: '#1E90FF', yellow: '#FFA502' };

  const cardW = 100;
  const cardH = 40;
  const perimeter = (cardW + cardH) * 2;

  return (
    <div className={clsx(
      "flex items-center gap-2 transition-all duration-300",
      diceSide === 'right' ? 'flex-row' : 'flex-row-reverse'
    )}>
       <div className={clsx(
          "relative transition-all duration-300 flex items-center bg-white/5 rounded-lg overflow-hidden p-1 gap-2",
          active ? "scale-105 z-30 shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "grayscale opacity-30",
       )} style={{ width: cardW, height: cardH }}>
          
          {active && !player.rank && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${cardW} ${cardH}`}>
               <motion.rect
                 key={timerKey}
                 x="1" y="1" width={cardW - 2} height={cardH - 2}
                 rx="7" ry="7"
                 fill="none"
                 strokeWidth="2.5"
                 className={colorStyles[player.color]}
                 strokeDasharray={perimeter}
                 initial={{ strokeDashoffset: 0 }}
                 animate={{ strokeDashoffset: perimeter }}
                 transition={{ duration: TURN_DURATION / 1000, ease: "linear" }}
                 strokeLinecap="round"
               />
               <rect x="1" y="1" width={cardW - 2} height={cardH - 2} rx="7" ry="7" fill="none" strokeWidth="1" className="stroke-white/5" />
             </svg>
          )}

          <div className="relative w-6 h-6 border border-white/10 rounded overflow-hidden flex-shrink-0 z-10">
             <img src={player.avatarUrl} className="w-full h-full object-cover" alt={player.name} />
          </div>
          <div className="flex-1 overflow-hidden z-10">
             <div className="font-black truncate uppercase tracking-tighter text-[8px] leading-tight text-white">{player.name}</div>
             <div className="flex gap-1 mt-0.5 opacity-40">
                <div className="text-[6px] font-mono">H:{player.pawns.filter(p=>p.location===-1).length}</div>
                <div className="text-[6px] font-mono">W:{player.pawns.filter(p=>p.location===99).length}</div>
             </div>
          </div>
          
          {player.rank && (
             <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                <Hash size={8} className="text-ludo-yellow" />
                <span className="text-ludo-yellow font-black text-xs italic">{player.rank}</span>
             </div>
          )}
       </div>

       <div className={clsx(
         "w-10 h-10 md:w-11 md:h-11 bg-white/[0.03] border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300",
         active ? "border-white/20 bg-white/10" : "opacity-10"
       )}>
          <AnimatePresence mode="wait">
            {active && !player.rank && (
              <motion.div 
                key="active-dice-content"
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full h-full p-1"
              >
                 <Dice 
                    value={diceValue} 
                    rolling={isRolling} 
                    onRoll={onRoll} 
                    disabled={player.isBot || hasRolled} 
                    color={diceColors[player.color]} 
                    className="w-full h-full" 
                 />
              </motion.div>
            )}
          </AnimatePresence>
          {!active && !player.rank && (
             <div className="w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" />
          )}
       </div>
    </div>
  );
};
