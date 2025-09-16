// src/types/tennisProcessor.ts
// TypeScript interfaces matching the Rust backend structures

export interface RawTennisData {
  id?: string;
  match_id?: string;
  player1?: RawPlayerData;
  player2?: RawPlayerData;
  team1?: RawPlayerData;
  team2?: RawPlayerData;
  score?: RawScoreData;
  sets?: Record<string, RawSetData>;
  serving_player?: number;
  servingPlayer?: number;
  current_set?: number;
  currentSet?: number;
  is_tiebreak?: boolean;
  isTiebreak?: boolean;
  match_status?: string;
  matchStatus?: string;
}

export interface RawPlayerData {
  name?: string;
  country?: string;
  seed?: number;
}

export interface RawScoreData {
  player1_sets?: number;
  player1Sets?: number;
  player2_sets?: number;
  player2Sets?: number;
  player1_games?: number;
  player1Games?: number;
  player2_games?: number;
  player2Games?: number;
  player1_points?: string;
  player1Points?: string;
  player2_points?: string;
  player2Points?: string;
}

export interface RawSetData {
  player1?: number;
  player2?: number;
}

// Processed data structures (matching Rust backend)
export interface ProcessedTennisMatch {
  match_id: string;
  player1: ProcessedPlayerData;
  player2: ProcessedPlayerData;
  score: ProcessedScoreData;
  sets: Record<string, ProcessedSetData>;
  serving_player: number;
  current_set: number;
  is_tiebreak: boolean;
  match_status: string;
  // Legacy properties for compatibility
  servingPlayer: number;
  currentSet: number;
  isTiebreak: boolean;
  matchStatus: string;
}

export interface ProcessedPlayerData {
  name: string;
  country?: string;
  seed?: number;
}

export interface ProcessedScoreData {
  // New property names
  player1_sets: number;
  player2_sets: number;
  player1_games: number;
  player2_games: number;
  player1_points: string;
  player2_points: string;
  // Legacy property names for compatibility
  player1Sets: number;
  player2Sets: number;
  player1Games: number;
  player2Games: number;
  player1Points: string;
  player2Points: string;
}

export interface ProcessedSetData {
  player1: number;
  player2: number;
}

// Tauri command responses
export interface ProcessTennisDataResponse {
  match_id: string;
  player1: ProcessedPlayerData;
  player2: ProcessedPlayerData;
  score: ProcessedScoreData;
  sets: Record<string, ProcessedSetData>;
  serving_player: number;
  current_set: number;
  is_tiebreak: boolean;
  match_status: string;
  servingPlayer: number;
  currentSet: number;
  isTiebreak: boolean;
  matchStatus: string;
}

export interface ProcessBatchResponse {
  data: ProcessTennisDataResponse[];
}

export interface ValidateTennisDataResponse {
  isValid: boolean;
}
