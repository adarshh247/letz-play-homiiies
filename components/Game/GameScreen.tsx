
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { LudoBoard } from './LudoBoard';
import { Dice } from './Dice';
import { DIYControl } from './DIYControl';
import { SharpButton } from '../ui/SharpButton';
import { PlayerState, PlayerColor } from '../../types';
import { isValidMove, SAFE_INDICES, PLAYER_START_OFFSETS } from './gameUtils';
import { X, Trophy, Wand2, Crown, Gem, Coins, Frown } from 'lucide-react';

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
  
  // Game Status
  const [isGameOver, setIsGameOver] = useState(false);
  const [turnTimerKey, setTurnTimerKey] = useState(0);
  const [isMovingPawn, setIsMovingPawn] = useState(false);

  // --- Secret DIY State ---
  const [diyUnlocked, setDiyUnlocked] = useState(false);
  const [diyActive, setDiyActive] = useState(false);
  const [showDiyPopup, setShowDiyPopup] = useState(false);
  const diySelectedRef = useRef<number | null>(null);

  const currentPlayer = players[turnIndex];

  // Helper to get number of finished players
  const getFinishedCount = useCallback(() => {
    return players.filter(p => p.rank).length;
  }, [players]);

  // --- Core Game Logic ---
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

  const handleRoll = useCallback(() => {
    if (isRolling || hasRolled || isGameOver || isMovingPawn || currentPlayer.rank) return;
    setIsRolling(true);
    if (diyActive) {
      setShowDiyPopup(true);
      diySelectedRef.current = null;
    }
    const rollDuration = diyActive ? 1200 : 600; 
    setTimeout(() => {
      let rolledValue = Math.floor(Math.random() * 6) + 1;
      if (diyActive) {
        setShowDiyPopup(false);
        if (diySelectedRef.current !== null) {
          rolledValue = diySelectedRef.current;
        }
      }
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
    }, rollDuration);
  }, [currentPlayer, isRolling, hasRolled, isGameOver, isMovingPawn, nextTurn, diyActive]);

  const handleDiySelect = (value: number) => {
    diySelectedRef.current = value;
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
        const nextLoc = (currentLoc === -1) ? 0 : (currentLoc + i);
        setPawnLocation(pawnId, nextLoc);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    const finalLocation = (currentLoc === -1) ? 0 : (currentLoc + diceValue);
    
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
                      const oppGlobal = oppPawn.location !== -1 && oppPawn.location < 51 
                          ? (oppOffset + oppPawn.location) % 52 
                          : -999;
                      
                      if (globalPos === oppGlobal) {
                          newPlayers[oppIdx].pawns[oppPawnIdx].location = -1;
                      }
                  });
              }
           });
        }
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
            const basePawn = validMovePawns.find(id => {
                const p = currentPlayer.pawns.find(p => p.id === id);
                return p?.location === -1;
            });
            const moveId = basePawn || validMovePawns[Math.floor(Math.random() * validMovePawns.length)];
            animateMoveSequence(moveId);
          }
        }, 1000);
      }
    }
  }, [currentPlayer, isRolling, hasRolled, validMovePawns, handleRoll, animateMoveSequence, isGameOver, isMovingPawn, diyActive]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ludo-dark overflow-hidden">
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

       <div className="flex-1 relative flex flex-col lg:flex-row items-center justify-center p-2 md:p-6 gap-2 md:gap-12 overflow-y-auto overflow-x-hidden">
          <AnimatePresence>
            {isGameOver && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 p-6 overflow-y-auto">
                  <Trophy size={48} className="text-ludo-yellow mb-4" />
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-6 md:mb-8 italic uppercase tracking-tighter">Match Ended</h2>
                  <div className="w-full max-w-sm space-y-2">
                    {players.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p, index) => (
                        <div key={p.id} className={clsx("flex items-center p-3 border border-white/10 gap-4 rounded-xl", p.rank === 1 ? "bg-ludo-yellow/10" : "bg-white/5")}>
                           <div className="font-black text-xl w-6 text-white/50">{p.rank}</div>
                           <div className="w-10 h-10 border border-white/20 rounded-lg overflow-hidden"><img src={p.avatarUrl} className="w-full h-full" /></div>
                           <div className="flex-1 font-bold text-white text-sm uppercase tracking-wider">{p.name}</div>
                           <div>{p.rank === 1 && <Crown size={16} className="text-ludo-yellow fill-ludo-yellow" />}</div>
                        </div>
                    ))}
                  </div>
                  <SharpButton onClick={onExit} className="mt-8 w-full max-w-xs">Return to Lobby</SharpButton>
               </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>{showDiyPopup && <DIYControl onSelect={handleDiySelect} />}</AnimatePresence>

          {/* Large Screen Left Cards */}
          <div className="hidden lg:flex flex-col gap-8 justify-center w-56">
             <PlayerCard player={players[0]} active={turnIndex === 0} timerKey={turnTimerKey} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} />
             <PlayerCard player={players[3]} active={turnIndex === 3} timerKey={turnTimerKey} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} />
          </div>

          <div className="flex-shrink-0 w-full max-w-[320px] xs:max-w-[380px] md:max-w-[480px] lg:max-w-[550px] aspect-square relative z-10">
             <LudoBoard players={players} currentTurn={currentPlayer.color} onPawnClick={handlePawnClick} validMovePawns={validMovePawns} onUnlockSecret={() => setDiyUnlocked(true)} />
          </div>

          {/* Large Screen Right Cards */}
          <div className="hidden lg:flex flex-col gap-8 justify-center w-56">
             <PlayerCard player={players[1]} active={turnIndex === 1} timerKey={turnTimerKey} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} />
             <PlayerCard player={players[2]} active={turnIndex === 2} timerKey={turnTimerKey} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} />
          </div>

          {/* Medium/Small Screens (Grid below/above board) */}
          <div className="lg:hidden grid grid-cols-2 md:grid-cols-4 w-full gap-2 max-w-[480px] md:max-w-[800px] mt-2">
             {players.map((p, idx) => (
               <PlayerCard key={p.id} player={p} active={turnIndex === idx} timerKey={turnTimerKey} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} compact />
             ))}
          </div>
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
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, active, timerKey, diceValue, isRolling, hasRolled, onRoll, compact }) => {
  const colorStyles = { red: 'border-ludo-red', green: 'border-ludo-green', blue: 'border-ludo-blue', yellow: 'border-ludo-yellow' };
  const bgStyles = { red: 'bg-ludo-red', green: 'bg-ludo-green', blue: 'bg-ludo-blue', yellow: 'bg-ludo-yellow' };
  const diceColors = { red: '#FF4757', green: '#2ED573', blue: '#1E90FF', yellow: '#FFA502' };

  return (
    <div className={clsx(
       "relative transition-all duration-300 flex items-center bg-white/5 border-2 rounded-2xl overflow-hidden",
       active ? `${colorStyles[player.color]} scale-105 z-30 shadow-[0_0_20px_rgba(0,0,0,0.5)]` : "border-white/5 grayscale opacity-50",
       compact ? "p-2 gap-2 h-14" : "p-3 gap-3 h-24"
    )}>
       <div className={clsx("relative border border-white/20 flex-shrink-0 rounded-xl overflow-hidden", compact ? "w-7 h-7" : "w-12 h-12")}>
          <img src={player.avatarUrl} className="w-full h-full object-cover" />
       </div>
       <div className="flex-1 min-w-0">
          <div className={clsx("font-black truncate uppercase tracking-tighter leading-none", compact ? "text-[9px]" : "text-sm italic")}>{player.name}</div>
          <div className="flex gap-1 mt-0.5 md:mt-1 opacity-50">
             <div className="text-[7px] md:text-[8px] bg-white/10 px-0.5 md:px-1 rounded font-mono uppercase">H:{player.pawns.filter(p=>p.location===-1).length}</div>
             <div className="text-[7px] md:text-[8px] bg-white/10 px-0.5 md:px-1 rounded font-mono uppercase">W:{player.pawns.filter(p=>p.location===99).length}</div>
          </div>
       </div>
       {active && !player.rank && (
         <Dice value={diceValue} rolling={isRolling} onRoll={onRoll} disabled={player.isBot || hasRolled} color={diceColors[player.color]} className={compact ? "w-9 h-9" : "w-14 h-14"} />
       )}
       {active && !player.rank && (
          <motion.div key={timerKey} className={clsx("absolute bottom-0 left-0 h-[2px] z-10", bgStyles[player.color])} initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: TURN_DURATION / 1000, ease: "linear" }} />
       )}
       {player.rank && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <span className="text-ludo-yellow font-black text-lg md:text-xl italic">{player.rank}#</span>
          </div>
       )}
    </div>
  );
};
