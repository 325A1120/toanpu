export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  label: string;
}

export interface CpuPersonality {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bluffRate: number; // 0.0 - 1.0 (tendency to lie when not forced to)
  doubtSuspicion: number; // 0.0 - 1.0 (skepticism)
  color: string;
  styleDesc: string;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  cards: Card[];
  color: string;
  personality?: CpuPersonality;
}

export interface PlayedCardsRecord {
  playerId: string;
  playerName: string;
  claimedRank: Rank;
  cards: Card[];
  isLie: boolean;
}

export interface DoubtResolution {
  doubterId: string;
  doubterName: string;
  targetPlayerId: string;
  targetPlayerName: string;
  claimedRank: Rank;
  revealedCards: Card[];
  wasLie: boolean;
  pileCount: number;
  penalizedPlayerId: string;
  penalizedPlayerName: string;
  penalizedPlayerBeforeCount: number;
  penalizedPlayerAfterCount: number;
  honestPlayerName?: string;
  honestPlayerCount?: number;
  doubtBonusPlayerName?: string;
  doubtBonusPlayerAfterCount?: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'play' | 'doubt_call' | 'doubt_success' | 'doubt_failed' | 'win' | 'info';
}

export type GamePhase =
  | 'START_MENU'
  | 'PLAYER_TURN'
  | 'CPU_THINKING'
  | 'WAITING_FOR_DOUBT'
  | 'DOUBT_REVEAL'
  | 'TURN_TRANSITION'
  | 'GAME_OVER';

export interface GameStats {
  turnsElapsed: number;
  doubtsCalled: number;
  doubtsSuccess: number;
  bluffsAttempted: number;
  bluffsSuccessful: number;
}
