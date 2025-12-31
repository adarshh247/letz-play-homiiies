
import { PlayerColor, Pawn } from '../../types';

// Coordinate Type: [x, y]
type Coordinate = [number, number];

export const MAIN_PATH_COORDS: Coordinate[] = [
  // Red's strip (moving right)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // Up Blue's strip (now Top-Right)
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // Top Middle
  [7, 0], [8, 0],
  // Down Blue's strip (now Top-Right)
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // Right Yellow's strip
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // Right Middle
  [14, 7], [14, 8],
  // Left Yellow's strip
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // Down Green's strip (now Bottom-Left)
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // Bottom Middle
  [7, 14], [6, 14],
  // Up Green's strip (now Bottom-Left)
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // Left Red's strip
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // Left Middle
  [0, 7],
  // Loop closer
  [0, 6]
];

export const HOME_PATHS: Record<PlayerColor, Coordinate[]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  blue: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]], // Top-Right Path
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  green: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]], // Bottom-Left Path
};

export const BASE_POSITIONS: Record<PlayerColor, Coordinate[]> = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  blue: [[10, 1], [10, 4], [13, 1], [13, 4]], // Top-Right Base
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  green: [[1, 10], [1, 13], [4, 10], [4, 13]], // Bottom-Left Base
};

export const PLAYER_START_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

export const PLAYER_PATHS_START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export const getPawnCoordinates = (color: PlayerColor, pawnLocation: number, pawnId: string): Coordinate => {
  if (pawnLocation === -1) {
    const pawnIndex = parseInt(pawnId.split('-')[1]) || 0;
    return BASE_POSITIONS[color][pawnIndex % 4];
  }

  if (pawnLocation === 99) {
    switch (color) {
      case 'red': return [6, 7];
      case 'blue': return [7, 6];
      case 'yellow': return [8, 7];
      case 'green': return [7, 8];
    }
  }

  if (pawnLocation >= 51) { 
     const homeIndex = pawnLocation - 51;
     if (homeIndex < HOME_PATHS[color].length) {
       return HOME_PATHS[color][homeIndex];
     }
     return [7, 7];
  }

  const offset = PLAYER_START_OFFSETS[color];
  const globalIndex = (offset + pawnLocation) % 52;
  return MAIN_PATH_COORDS[globalIndex];
};

export const isValidMove = (currentLoc: number, diceValue: number): boolean => {
  if (currentLoc === -1) return diceValue === 6;
  if (currentLoc === 99) return false;
  // Pawns can move into home (99) if they exceed 56 (the last path square)
  if (currentLoc + diceValue > 57) return false;
  return true;
};
