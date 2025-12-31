
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { LudoBoard } from './LudoBoard';
import { Dice } from './Dice';
import { SharpButton } from '../ui/SharpButton';
import { PlayerState, PlayerColor, User, RoomParticipant } from '../../types';
import { isValidMove, SAFE_INDICES, PLAYER_START_OFFSETS } from './gameUtils';
import { X, Trophy, Sparkles, Hash } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface GameScreenProps {
  user: User;
  onExit: () => void;
  vsComputer?: boolean;
  participants?: RoomParticipant[];
  roomCode?: string;
  socket?: Socket | null;
}

const TURN_DURATION = 15000;
const MOVE_STEP_DELAY = 180;

export const GameScreen: React.FC<GameScreenProps> = ({ user, onExit, vsComputer = false, participants, roomCode, socket }) => {
  const [players, setPlayers] = useState<PlayerState[]>(() => {
    const colors: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];
    
    // Case A: Multiplayer Room Initialization
    if (participants && participants.length > 0) {
      return colors.map((color, index) => {
        const p = participants[index];
        if (p) {
          return {
            id: p.id,
            name: p.name,
            color,
            avatarUrl: p.avatarUrl,
            isBot: false,
            pawns: [0, 1, 2, 3].map(i => ({ id: `${color}-${i}`, color, location: -1 }))
          };
        }
        // Fill empty slots with bots
        return {
          id: `bot-${color}`,
          name: `Bot ${color.toUpperCase()}`,
          color,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Bot${color}`,
          isBot: true,
          pawns: [0, 1, 2, 3].map(i => ({ id: `${color}-${i}`, color, location: -1 }))
        };
      });
    }

    // Case B: Solo vs AI / Local initialization
    return colors.map((color, index) => {
      if (index === 0) {
        return {
          id: user.id,
          name: user.name,
          color,
          avatarUrl: user.avatarUrl,
          isBot: false,
          pawns: [0, 1, 2, 3].map(i => ({ id: `${color}-${i}`, color, location: -1 }))
        };
      }
      return {
        id: `bot-${color}`,
        name: `Bot ${color.toUpperCase()}`,
        color,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Bot${color}`,
        isBot: true,
        pawns: [0, 1, 2, 3].map(i => ({ id: `${color}-${i}`, color, location: -1 }))
      };
    });
  });

  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [validMovePawns, setValidMovePawns] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMovingPawn, setIsMovingPawn] = useState(false);
  const [pawnCelebration, setPawnCelebration] = useState<{ color: PlayerColor, pawnId: string } | null>(null);

  const currentPlayer = players[turnIndex];
  const isMyTurn = currentPlayer?.id === user.id;

  // Local/AI Next Turn Logic
  const nextTurnLocal = useCallback(() => {
    let nextIdx = (turnIndex + 1) % 4;
    let loopLimit = 0;
    while (players[nextIdx].rank && loopLimit < 4) {
      nextIdx = (nextIdx + 1) % 4;
      loopLimit++;
    }
    
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setValidMovePawns([]);
    setIsMovingPawn(false);
  }, [turnIndex, players]);

  // Socket Synchronization
  useEffect(() => {
    if (!socket || !roomCode || vsComputer) return;

    socket.on('sync_dice', ({ value, playerIndex }) => {
      setDiceValue(value);
      setIsRolling(false);
      setHasRolled(true);
      const moves: string[] = [];
      players[playerIndex].pawns.forEach(pawn => {
        if (isValidMove(pawn.location, value)) moves.push(pawn.id);
      });
      setValidMovePawns(moves);
      if (moves.length === 0) {
        setTimeout(handleNextTurn, 1000);
      }
    });

    socket.on('sync_move', ({ pawnId, finalLocation, playerIndex }) => {
      syncMoveExternally(pawnId, finalLocation, playerIndex);
    });

    socket.on('sync_turn', (nextIdx) => {
      setTurnIndex(nextIdx);
      setHasRolled(false);
      setValidMovePawns([]);
      setIsMovingPawn(false);
    });

    return () => {
      socket.off('sync_dice');
      socket.off('sync_move');
      socket.off('sync_turn');
    };
  }, [socket, roomCode, players, turnIndex, vsComputer]);

  const handleNextTurn = () => {
    if (vsComputer) {
      nextTurnLocal();
      return;
    }
    if (!socket || !roomCode || !isMyTurn) return;
    let nextIdx = (turnIndex + 1) % 4;
    while (players[nextIdx].rank) nextIdx = (nextIdx + 1) % 4;
    socket.emit('next_turn', { roomCode, nextIndex: nextIdx });
  };

  const handleRoll = () => {
    if (isRolling || hasRolled || isMovingPawn) return;
    if (!vsComputer && !isMyTurn) return;
    
    setIsRolling(true);
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      if (vsComputer) {
        setDiceValue(val);
        setIsRolling(false);
        setHasRolled(true);
        const moves: string[] = [];
        currentPlayer.pawns.forEach(pawn => {
          if (isValidMove(pawn.location, val)) moves.push(pawn.id);
        });
        setValidMovePawns(moves);
        if (moves.length === 0) setTimeout(handleNextTurn, 1000);
      } else {
        socket?.emit('dice_rolled', { roomCode, value: val, playerIndex: turnIndex });
      }
    }, 600);
  };

  const syncMoveExternally = async (pawnId: string, finalLocation: number, playerIdx: number) => {
    setIsMovingPawn(true);
    const player = players[playerIdx];
    const pawn = player.pawns.find(p => p.id === pawnId);
    if (!pawn) return;

    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== playerIdx) return p;
      return {
        ...p,
        pawns: p.pawns.map(pw => pw.id === pawnId ? { ...pw, location: finalLocation } : pw)
      };
    }));

    if (finalLocation === 99) setPawnCelebration({ color: player.color, pawnId });
    setTimeout(() => {
      setPawnCelebration(null);
      setIsMovingPawn(false);
      if (vsComputer) handleNextTurn();
    }, 1000);
  };

  const handlePawnClick = (playerId: string, pawnId: string) => {
    if (!hasRolled || isMovingPawn) return;
    if (!vsComputer && playerId !== user.id) return;
    if (!validMovePawns.includes(pawnId)) return;

    const pawn = currentPlayer.pawns.find(p => p.id === pawnId);
    if (!pawn) return;
    
    let finalLoc = (pawn.location === -1) ? 0 : (pawn.location + diceValue);
    if (finalLoc >= 57) finalLoc = 99;
    
    if (vsComputer) {
      syncMoveExternally(pawnId, finalLoc, turnIndex);
    } else {
      socket?.emit('move_pawn', { roomCode, pawnId, finalLocation: finalLoc, playerIndex: turnIndex });
      setTimeout(handleNextTurn, 1000);
    }
  };

  // Bot Automation for Computer Mode
  useEffect(() => {
    if (vsComputer && currentPlayer.isBot && !isGameOver && !isMovingPawn) {
      if (!isRolling && !hasRolled) {
        setTimeout(handleRoll, 1000);
      } else if (hasRolled) {
        setTimeout(() => {
          if (validMovePawns.length > 0) {
            const moveId = validMovePawns[Math.floor(Math.random() * validMovePawns.length)];
            handlePawnClick(currentPlayer.id, moveId);
          }
        }, 800);
      }
    }
  }, [vsComputer, currentPlayer, isRolling, hasRolled, validMovePawns, isGameOver, isMovingPawn]);

  if (players.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ludo-dark overflow-hidden">
       <div className="flex-none p-4 flex justify-between items-center bg-ludo-dark/80 border-b border-white/10">
          <div className="font-black text-xl tracking-tighter text-white uppercase">Homiies<span className="text-ludo-red">.</span></div>
          <SharpButton variant="secondary" onClick={onExit} icon={<X size={12} />}>Exit</SharpButton>
       </div>

       <div className="flex-1 relative flex flex-col items-center justify-center p-6 gap-8">
          <AnimatePresence>
            {pawnCelebration && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute z-[100] bg-black/60 p-8 rounded-full border border-white/20">
                 <Sparkles className="text-ludo-yellow w-12 h-12 mb-2 animate-bounce" />
                 <div className="font-black text-white text-2xl uppercase italic">PAWN HOME!</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between w-full max-w-[750px] gap-8">
             <PlayerTurnBox player={players[0]} active={turnIndex === 0} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="right" isUser={players[0]?.id === user.id} />
             <PlayerTurnBox player={players[1]} active={turnIndex === 1} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="left" isUser={players[1]?.id === user.id} />
          </div>

          <div className="flex-shrink-0 w-full max-w-[460px] aspect-square relative z-10">
             <LudoBoard players={players} currentTurn={currentPlayer?.color} onPawnClick={handlePawnClick} validMovePawns={validMovePawns} />
          </div>

          <div className="flex justify-between w-full max-w-[750px] gap-8">
             <PlayerTurnBox player={players[3]} active={turnIndex === 3} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="right" isUser={players[3]?.id === user.id} />
             <PlayerTurnBox player={players[2]} active={turnIndex === 2} diceValue={diceValue} isRolling={isRolling} hasRolled={hasRolled} onRoll={handleRoll} diceSide="left" isUser={players[2]?.id === user.id} />
          </div>
       </div>
    </div>
  );
};

interface PlayerTurnBoxProps {
   player: PlayerState; active: boolean; diceValue: number; isRolling: boolean; hasRolled: boolean; onRoll: () => void; diceSide: 'left' | 'right'; isUser: boolean;
}

const PlayerTurnBox: React.FC<PlayerTurnBoxProps> = ({ player, active, diceValue, isRolling, hasRolled, onRoll, diceSide, isUser }) => {
  if (!player) return null;
  const diceColors = { red: '#FF4757', green: '#2ED573', blue: '#1E90FF', yellow: '#FFA502' };
  return (
    <div className={clsx("flex items-center gap-2", diceSide === 'right' ? 'flex-row' : 'flex-row-reverse')}>
       <div className={clsx("relative flex items-center bg-white/5 rounded-lg p-1 gap-2 w-[100px] h-[40px]", active ? "scale-105 shadow-xl opacity-100 ring-1 ring-white/20" : "grayscale opacity-30")}>
          <div className="w-6 h-6 border border-white/10 rounded overflow-hidden">
             <img src={player.avatarUrl} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="font-black truncate uppercase text-[8px] text-white leading-tight">{player.name}</div>
            {isUser && <div className="text-[6px] font-bold text-ludo-yellow uppercase">You</div>}
          </div>
       </div>
       <div className={clsx("w-10 h-10 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center transition-all", active ? "bg-white/10 border-white/20" : "opacity-10")}>
          {active && <Dice value={diceValue} rolling={isRolling} onRoll={onRoll} disabled={hasRolled || (!isUser && player.isBot === false)} color={diceColors[player.color]} className="w-full h-full" />}
       </div>
    </div>
  );
};
