
export enum ViewState {
  LOBBY = 'LOBBY',
  MODE_SELECT = 'MODE_SELECT',
  FRIEND_OPTIONS = 'FRIEND_OPTIONS',
  CREATE_ROOM = 'CREATE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  PLAYING_COMPUTER = 'PLAYING_COMPUTER',
  GAME = 'GAME',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  coins: number;
}

export const COIN_REWARDS = [50, 100, 200, 500, 1000, 0];

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface Pawn {
  id: string;
  color: PlayerColor;
  location: number; // -1 = Base, 0-51 = Main Path, 52-57 = Home Path, 99 = Home
}

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  avatarUrl: string;
  isBot: boolean;
  pawns: Pawn[];
  rank?: number; // 1 = 1st, 2 = 2nd, 3 = 3rd, 4 = Loser
}
