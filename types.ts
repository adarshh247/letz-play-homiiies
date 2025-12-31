
export enum ViewState {
  AUTH = 'AUTH',
  LOBBY = 'LOBBY',
  MODE_SELECT = 'MODE_SELECT',
  FRIEND_OPTIONS = 'FRIEND_OPTIONS',
  CREATE_ROOM = 'CREATE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  PLAYING_COMPUTER = 'PLAYING_COMPUTER',
  GAME = 'GAME',
  WALLET = 'WALLET',
  TOURNAMENT = 'TOURNAMENT',
}

export interface UserStats {
  gamesWon: number;
  gamesLost: number;
  winStreak: number;
  tokensCaptured: number;
  tournamentsWon: number;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  coins: number;
  level: number;
  stats: UserStats;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  participants: RoomParticipant[];
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

export interface Tournament {
  id: string;
  title: string;
  prize: number;
  entryFee: number;
  status: 'ongoing' | 'upcoming';
  startTime?: string;
  participants: number;
  maxParticipants: number;
}
