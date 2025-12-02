
import { PlayerColor, Pawn } from '../../types';

// Coordinate Type: [x, y]
type Coordinate = [number, number];

// 52 Step Main Path (Global Loop)
// We define the path starting from Red's Start (1,6) and going clockwise.
// This is a standard Ludo path trace on a 15x15 grid.
const GLOBAL_PATH: Coordinate[] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // Red Straight
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // Up the Green Arm
  [7, 0], [8, 0], // Top Turn
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], // Down the Green Arm
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // Right the Yellow Arm
  [14, 7], [14, 8], // Right Turn
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 8], // Left the Yellow Arm (Wait, 8,8 is center? No. 8,8 is end of path before down?)
  // Correction: The path goes into the arm. 
  // Let's re-verify specific indices.
  // The path length is 52. 
  // Each arm has 6 cells out, 2 cells turn, 6 cells in.
  // 6 + 6 + 1(turn) ? No. 
  // Standard ludo: 6 cells per arm column.
  // Let's map indices carefully.
  // 0-4: (1,6) to (5,6)
  // 5-10: (6,5) to (6,0)
  // 11-12: (7,0) to (8,0)
  // 13-17: (8,1) to (8,5)
  // 18: (8,6) ?? No, (8,6) is usually a safe spot or junction.
  // Let's use a simpler mapping strategy:
  // We need 52 valid coordinates for the outer loop.
  // We will trust the previous visualization logic and map to it.
];

// Helper to generate coordinates based on 4 quadrants
// Quadrant 1 (Top-Left, Red Start Zone)
// Quadrant 2 (Top-Right, Green Start Zone)
// Quadrant 3 (Bottom-Right, Yellow Start Zone)
// Quadrant 4 (Bottom-Left, Blue Start Zone)

export const MAIN_PATH_COORDS: Coordinate[] = [
  // Red's strip (moving right)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // Up Green's strip
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // Top Middle
  [7, 0], [8, 0],
  // Down Green's strip
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // Right Yellow's strip
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // Right Middle
  [14, 7], [14, 8],
  // Left Yellow's strip
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // Down Blue's strip
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // Bottom Middle
  [7, 14], [6, 14],
  // Up Blue's strip
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // Left Red's strip
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // Left Middle
  [0, 7] 
];

// Verify length
// 5 + 6 + 2 + 5 + 6 + 2 + 5 + 6 + 2 + 5 + 6 + 1 = 51? 
// The loop needs to be 52.
// Let's re-count manually.
// Segments: 
// 1. Red Start -> Bend: (1,6)..(5,6) = 5
// 2. Bend -> Top: (6,5)..(6,0) = 6
// 3. Top Cross: (7,0), (8,0) = 2
// 4. Top -> Bend: (8,1)..(8,5) = 5
// 5. Bend -> Right: (9,6)..(14,6) = 6
// 6. Right Cross: (14,7), (14,8) = 2
// 7. Right -> Bend: (13,8)..(9,8) = 5
// 8. Bend -> Bottom: (8,9)..(8,14) = 6
// 9. Bottom Cross: (7,14), (6,14) = 2
// 10. Bottom -> Bend: (6,13)..(6,9) = 5
// 11. Bend -> Left: (5,8)..(0,8) = 6
// 12. Left Cross: (0,7) = 1. 
// Total: 5 + 6 + 2 + 5 + 6 + 2 + 5 + 6 + 2 + 5 + 6 + 1 = 51.
// Missing one. (0,7) -> (0,6)? No.
// Usually standard board is 52. 
// The issue is likely the corner transitions.
// Let's assume the array above is the "Board Path".
// Indices 0-50 (51 steps). 
// Wait, Ludo usually has 13 steps per player quadrant * 4 = 52.
// My count is 51. Let's add (0,6) as the last step before completing loop? 
// No, (0,6) is adjacent to start (1,6). 
// Let's just fix the "Left Red Strip" segment.
// It goes [5,8]..[0,8]. (6 steps).
// Then [0,7] (1 step).
// Then next is [1,6] (Start).
// The missing step is likely the start position itself being part of the loop?
// Let's add [0, 6] to the end.
MAIN_PATH_COORDS.push([0, 6]);
// Now length is 52.

export const HOME_PATHS: Record<PlayerColor, Coordinate[]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], // Center is (6,7) ?? No center is usually larger.
  // Center is typically the triangle. We'll map the "Home" location (99) to the center of triangles.
  // These are the 5 steps INTO home + the final home spot.
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

// Base positions for rendering waiting pawns (4 positions per base)
export const BASE_POSITIONS: Record<PlayerColor, Coordinate[]> = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  green: [[10, 1], [10, 4], [13, 1], [13, 4]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  blue: [[1, 10], [1, 13], [4, 10], [4, 13]],
};

// Starting offset for each player on the global path (0-51)
export const PLAYER_START_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Start index for each player (Where they spawn when moving out of base)
// Based on MAIN_PATH_COORDS indices.
export const PLAYER_PATHS_START_INDEX: Record<PlayerColor, number> = {
  red: 0, // [1, 6]
  green: 13, // [8, 1]
  yellow: 26, // [13, 8]
  blue: 39, // [6, 13]
};

// Safe Spots (Star icons)
export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47]; // Approximate indices based on visual board
// Better to just check coordinates?
// Let's rely on indices relative to path.
// Standard safe spots are start points + 8th step?
// Based on visual LudoBoard.tsx:
// Red Start (0), Red Star (8)
// Green Start (13), Green Star (21)
// Yellow Start (26), Yellow Star (34)
// Blue Start (39), Blue Star (47)
// These match standard rules.

export const getPawnCoordinates = (color: PlayerColor, pawnLocation: number, pawnId: string): Coordinate => {
  // 1. Base
  if (pawnLocation === -1) {
    const pawnIndex = parseInt(pawnId.split('-')[1]) || 0; // assuming id format 'color-index'
    return BASE_POSITIONS[color][pawnIndex % 4];
  }

  // 2. Home (Won)
  if (pawnLocation === 99) {
    // Map to center triangle area roughly
    switch (color) {
      case 'red': return [6, 7]; // Slight offset into center
      case 'green': return [7, 6];
      case 'yellow': return [8, 7];
      case 'blue': return [7, 8];
    }
  }

  // 3. Home Path (52-57)
  if (pawnLocation >= 51) { 
     // location 51 is the LAST step on main path relative to player.
     // So 52 is first step on home path?
     // Actually, standard track is 0-50 (51 squares). Then 51-56 is home path.
     // Let's use 0-50 as main path relative to player.
     // So if pawnLocation > 50, use Home Path.
     const homeIndex = pawnLocation - 51;
     if (homeIndex < HOME_PATHS[color].length) {
       return HOME_PATHS[color][homeIndex];
     }
     return [7, 7]; // Fallback center
  }

  // 4. Main Path
  // Convert Player Relative Location to Global Path Index
  const offset = PLAYER_START_OFFSETS[color];
  const globalIndex = (offset + pawnLocation) % 52;
  return MAIN_PATH_COORDS[globalIndex];
};

export const isValidMove = (currentLoc: number, diceValue: number): boolean => {
  // If in base, need 6 to start
  if (currentLoc === -1) {
    return diceValue === 6;
  }
  // If moving to home
  // Max relative location is 56 (Home).
  // Current + Dice <= 56
  // Wait, if 56 is the final spot.
  if (currentLoc + diceValue > 56) {
    return false;
  }
  return true;
};
