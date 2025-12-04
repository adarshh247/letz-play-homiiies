
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
    // If game is over, stop turns
    if (getFinishedCount() >= 3) {
      setIsGameOver(true);
      return;
    }

    setHasRolled(false);
    setValidMovePawns([]);
    setTurnTimerKey(prev => prev + 1);
    setIsMovingPawn(false);
    
    // Bonus roll check: If rolled 6 AND user hasn't finished, they get another turn.
    // However, if they just finished (got a rank), they shouldn't play again.
    // We check the *current* player's status from the fresh players array (handled in logic below)
    // But here we rely on the state before update or check validity.
    // Simplified: If currentPlayer just finished, force next turn regardless of 6.
    
    // Find next valid player
    setTurnIndex(prevIndex => {
      let nextIndex = (prevIndex + 1) % 4;
      let loopCount = 0;
      
      // Loop until we find a player who hasn't finished
      // We need to access the LATEST players state to know who finished. 
      // Since we can't access updated players inside this callback easily without ref or dependency,
      // we rely on the dependency [players] which updates this callback when players change.
      while (players[nextIndex].rank && loopCount < 4) {
        nextIndex = (nextIndex + 1) % 4;
        loopCount++;
      }
      
      // If everyone finished (should be caught by game over), just stay
      if (loopCount >= 4) return prevIndex;

      // Logic for Bonus Turn (Roll 6)
      // Only if current player did NOT just finish and rolled a 6
      if (diceValue === 6 && !players[prevIndex].rank) {
         return prevIndex;
      }

      return nextIndex;
    });
  }, [diceValue, players, getFinishedCount]);

  const handleRoll = useCallback(() => {
    if (isRolling || hasRolled || isGameOver || isMovingPawn || currentPlayer.rank) return;

    setIsRolling(true);

    // DIY Interception: Wait longer and show popup if active
    if (diyActive) {
      setShowDiyPopup(true);
      diySelectedRef.current = null;
    }

    const rollDuration = diyActive ? 1200 : 600; 
    
    setTimeout(() => {
      let rolledValue = Math.floor(Math.random() * 6) + 1;

      // Force value if DIY was active and selected
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

    // STEP BY STEP ANIMATION
    for (let i = 1; i <= stepsToMove; i++) {
        const nextLoc = (currentLoc === -1) ? 0 : (currentLoc + i);
        setPawnLocation(pawnId, nextLoc);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Final Logic (Captures, Win) after animation finishes
    const finalLocation = (currentLoc === -1) ? 0 : (currentLoc + diceValue);
    
    let justFinished = false;

    // UPDATE STATE AT END OF MOVE
    setPlayers(prev => {
      const newPlayers = [...prev];
      const currentPlayerIdx = newPlayers.findIndex(p => p.id === player.id);
      
      // 1. CHECK CAPTURES
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
                          newPlayers[oppIdx].pawns[oppPawnIdx].location = -1; // Send to base
                      }
                  });
              }
           });
        }
      }

      // 2. CHECK WIN CONDITION (RANKING)
      // Check if current player has all pawns at 99
      const hasWonNow = newPlayers[currentPlayerIdx].pawns.every(p => p.location === 99);
      
      if (hasWonNow && !newPlayers[currentPlayerIdx].rank) {
         // Determine rank based on how many already have a rank
         const finishedCount = newPlayers.filter(p => p.rank).length;
         const newRank = finishedCount + 1;
         newPlayers[currentPlayerIdx].rank = newRank;
         justFinished = true;
      }

      return newPlayers;
    });

    // Determine Game Over State immediately after state update cycle
    setTimeout(() => {
        // We use the functional state update or re-query in next render, 
        // but for immediate logic flow:
        // logic is inside nextTurn or handled by effect.
        
        // If 3 players have ranked, the game is essentially over for the 4th.
        setPlayers(currentPlayers => {
            const finishedCount = currentPlayers.filter(p => p.rank).length;
            if (finishedCount === 3) {
                // Assign 4th rank (Loser) to the remaining player
                const loserIdx = currentPlayers.findIndex(p => !p.rank);
                if (loserIdx !== -1) {
                    const finalPlayers = [...currentPlayers];
                    finalPlayers[loserIdx].rank = 4; // 4th place
                    setIsGameOver(true);
                    return finalPlayers;
                }
            }
            return currentPlayers;
        });

        // Proceed to next turn if game isn't over
        if (!isGameOver) {
             nextTurn();
        }
    }, 500);

  }, [currentPlayer, diceValue, nextTurn, isGameOver, players]);

  // Turn Timer
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

  // Bot Turn
  useEffect(() => {
    if (currentPlayer.isBot && !isGameOver && !currentPlayer.rank) {
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
  }, [currentPlayer, isRolling, hasRolled, validMovePawns, handleRoll, animateMoveSequence, isGameOver, isMovingPawn, diyActive]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ludo-dark overflow-hidden">
       
       {/* Top Bar / Header */}
       <div className="flex-none p-4 flex justify-between items-center z-40 bg-ludo-dark/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
             <div className="font-black text-xl tracking-tighter text-white">HOMIIES<span className="text-ludo-red">.</span></div>
          </div>
          
          <div className="flex items-center gap-4">
            {diyUnlocked && (
              <button 
                onClick={() => setDiyActive(!diyActive)}
                className={clsx(
                  "p-2 rounded-md border-2 transition-all flex items-center gap-2 font-mono text-xs font-bold",
                  diyActive ? "bg-ludo-red text-white border-ludo-red animate-pulse" : "bg-transparent text-white/30 border-white/10 hover:border-white/50"
                )}
              >
                <Wand2 size={16} />
                <span>DIY: {diyActive ? 'ON' : 'OFF'}</span>
              </button>
            )}

            <SharpButton variant="secondary" className="px-3 py-1 text-xs h-8" onClick={onExit} icon={<X size={14} />}>
              LEAVE
            </SharpButton>
          </div>
       </div>

       {/* Main Game Area */}
       <div className="flex-1 relative flex flex-col md:flex-row items-center justify-center p-2 gap-2 md:gap-8">
          
          {/* Game Over Leaderboard Overlay */}
          <AnimatePresence>
            {isGameOver && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-6"
               >
                  <Trophy size={60} className="text-ludo-yellow mb-6 animate-bounce" />
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-8 text-center tracking-tighter">GAME OVER</h2>
                  
                  <div className="w-full max-w-md space-y-4">
                    {players
                      .slice() // copy
                      .sort((a, b) => (a.rank || 99) - (b.rank || 99)) // sort by rank
                      .map((p, index) => (
                        <motion.div 
                          key={p.id}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={clsx(
                            "flex items-center p-4 border-2 gap-4",
                            p.rank === 1 ? "bg-ludo-yellow/20 border-ludo-yellow" :
                            p.rank === 2 ? "bg-blue-400/20 border-blue-400" :
                            p.rank === 3 ? "bg-amber-700/20 border-amber-700" :
                            "bg-gray-800/50 border-gray-700 grayscale"
                          )}
                        >
                           <div className="font-black text-2xl w-8 text-center">
                             {p.rank === 1 ? '1' : p.rank === 2 ? '2' : p.rank === 3 ? '3' : '4'}
                           </div>
                           <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                             <img src={p.avatarUrl} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 font-bold text-white text-lg">{p.name}</div>
                           <div>
                              {p.rank === 1 && <Crown className="text-ludo-yellow fill-ludo-yellow" />}
                              {p.rank === 2 && <Gem className="text-blue-400 fill-blue-400" />}
                              {p.rank === 3 && <Coins className="text-amber-500 fill-amber-500" />}
                              {p.rank === 4 && <Frown className="text-gray-500" />}
                           </div>
                        </motion.div>
                      ))
                    }
                  </div>

                  <SharpButton onClick={onExit} className="mt-12 w-full max-w-xs">Return to Lobby</SharpButton>
               </motion.div>
            )}
          </AnimatePresence>

          {/* DIY Control Overlay */}
          <AnimatePresence>
             {showDiyPopup && <DIYControl onSelect={handleDiySelect} />}
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
                  onUnlockSecret={() => setDiyUnlocked(true)}
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
          {isGameOver ? "GAME OVER" : currentPlayer.isBot ? "Opponent Thinking..." : (turnIndex === 0 ? "Your Turn" : `${currentPlayer.name}'s Turn`)}
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

  // Rank Reward Rendering
  const renderReward = () => {
    if (!player.rank) return null;
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 drop-shadow-xl flex flex-col items-center">
        {player.rank === 1 && (
          <>
            <Crown size={compact ? 32 : 48} className="text-ludo-yellow fill-ludo-yellow animate-bounce" />
            <span className="bg-black/50 text-ludo-yellow text-[10px] px-2 rounded-full font-bold">1st Place</span>
          </>
        )}
        {player.rank === 2 && (
          <>
            <Gem size={compact ? 32 : 48} className="text-blue-400 fill-blue-400 animate-pulse" />
            <span className="bg-black/50 text-blue-400 text-[10px] px-2 rounded-full font-bold">2nd Place</span>
          </>
        )}
        {player.rank === 3 && (
          <>
            <Coins size={compact ? 32 : 48} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span className="bg-black/50 text-amber-500 text-[10px] px-2 rounded-full font-bold">3rd Place</span>
          </>
        )}
        {player.rank === 4 && (
          <>
             <Frown size={compact ? 32 : 48} className="text-gray-500" />
             <span className="bg-black/50 text-gray-400 text-[10px] px-2 rounded-full font-bold">Loser</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={clsx(
       "relative transition-all duration-300 flex items-center bg-ludo-dark border-2 backdrop-blur-sm shadow-lg overflow-hidden",
       active ? `${colorStyles[player.color]} scale-105 z-30 ring-2 ring-white/10` : "border-white/10 text-white/30 grayscale opacity-80",
       compact ? "flex-1 min-w-0 p-2 gap-2 h-20 rounded-lg" : "w-full p-4 gap-4 h-32 rounded-xl",
       align === 'right' && compact ? "flex-row-reverse text-right" : "",
       player.rank ? "opacity-100 grayscale-0 border-white/50 bg-white/5" : ""
    )}>
       {/* Turn Indicator */}
       {active && !player.rank && (
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

       {/* Render Rank Reward Overlay */}
       {renderReward()}

       {/* Active Dice Control - Only if not ranked */}
       {!player.rank && (
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
       )}

       {/* Timer Progress Bar */}
       {active && !player.rank && (
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
