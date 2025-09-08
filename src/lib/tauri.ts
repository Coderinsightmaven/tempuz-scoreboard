// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { MonitorInfo } from '../types/tauri';
import { GameState } from '../types/scoreboard';
import { io, Socket } from 'socket.io-client';

export interface TauriScoreboardConfig {
  id: string;
  name: string;
  filename: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export class TauriAPI {
  static async getMonitors(): Promise<MonitorInfo[]> {
    try {
      return await invoke('get_available_monitors');
    } catch (error) {
      console.error('Failed to get monitors:', error);
      return [];
    }
  }

  static async createScoreboardWindow(
    windowId: string,
    monitorId: number,
    width: number,
    height: number,
    x: number,
    y: number,
    offsetX: number = 0,
    offsetY: number = 0,
    scoreboardData?: any
  ): Promise<void> {
    try {
      await invoke('create_scoreboard_window', {
        windowId,
        monitorId,
        width,
        height,
        x,
        y,
        offsetX,
        offsetY,
        scoreboardData,
      });
    } catch (error) {
      console.error('Failed to create scoreboard window:', error);
      throw error;
    }
  }

  static async closeScoreboardWindow(windowId: string): Promise<void> {
    try {
      await invoke('close_scoreboard_window', { windowId });
    } catch (error) {
      console.error('Failed to close scoreboard window:', error);
      throw error;
    }
  }

  static async closeAllScoreboardWindows(): Promise<void> {
    try {
      await invoke('close_all_scoreboard_windows');
    } catch (error) {
      console.error('Failed to close all scoreboard windows:', error);
      throw error;
    }
  }

  static async updateScoreboardWindowPosition(
    windowId: string,
    x: number,
    y: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): Promise<void> {
    try {
      await invoke('update_scoreboard_window_position', { 
        windowId, 
        x, 
        y, 
        offsetX, 
        offsetY 
      });
    } catch (error) {
      console.error('Failed to update scoreboard window position:', error);
      throw error;
    }
  }

  static async updateScoreboardWindowSize(
    windowId: string,
    width: number,
    height: number
  ): Promise<void> {
    try {
      await invoke('update_scoreboard_window_size', { windowId, width, height });
    } catch (error) {
      console.error('Failed to update scoreboard window size:', error);
      throw error;
    }
  }

  static async listScoreboardWindows(): Promise<string[]> {
    try {
      return await invoke('list_scoreboard_windows');
    } catch (error) {
      console.error('Failed to list scoreboard windows:', error);
      return [];
    }
  }

  static async toggleScoreboardFullscreen(windowId: string): Promise<void> {
    try {
      await invoke('toggle_scoreboard_fullscreen', { windowId });
    } catch (error) {
      console.error('Failed to toggle scoreboard fullscreen:', error);
      throw error;
    }
  }

  static async setScoreboardFullscreen(windowId: string, fullscreen: boolean): Promise<void> {
    try {
      await invoke('set_scoreboard_fullscreen', { windowId, fullscreen });
    } catch (error) {
      console.error('Failed to set scoreboard fullscreen:', error);
      throw error;
    }
  }

  // Storage Commands
  static async saveScoreboard(name: string, config: any): Promise<string> {
    try {
      return await invoke('save_scoreboard', { name, data: config });
    } catch (error) {
      console.error('Failed to save scoreboard:', error);
      throw error;
    }
  }

  static async loadScoreboard(filename: string): Promise<TauriScoreboardConfig> {
    try {
      return await invoke('load_scoreboard', { filename });
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
      throw error;
    }
  }

  static async listScoreboards(): Promise<TauriScoreboardConfig[]> {
    try {
      return await invoke('list_scoreboards');
    } catch (error) {
      console.error('Failed to list scoreboards:', error);
      return [];
    }
  }

  static async deleteScoreboard(filename: string): Promise<void> {
    try {
      await invoke('delete_scoreboard', { filename });
    } catch (error) {
      console.error('Failed to delete scoreboard:', error);
      throw error;
    }
  }

  static async exportScoreboard(filename: string, exportPath: string): Promise<void> {
    try {
      await invoke('export_scoreboard', { filename, exportPath });
    } catch (error) {
      console.error('Failed to export scoreboard:', error);
      throw error;
    }
  }

  static async importScoreboard(importPath: string): Promise<TauriScoreboardConfig> {
    try {
      return await invoke('import_scoreboard', { importPath });
    } catch (error) {
      console.error('Failed to import scoreboard:', error);
      throw error;
    }
  }

  // Game State Commands
  static async updateGameState(gameState: GameState): Promise<void> {
    try {
      await invoke('update_game_state', { gameState });
    } catch (error) {
      console.error('Failed to update game state:', error);
      throw error;
    }
  }

  static async getGameState(): Promise<GameState | null> {
    try {
      return await invoke('get_game_state');
    } catch (error) {
      console.error('Failed to get game state:', error);
      return null;
    }
  }

  static async updateScore(team: 'home' | 'away', score: number): Promise<void> {
    try {
      await invoke('update_score', { team, score });
    } catch (error) {
      console.error('Failed to update score:', error);
      throw error;
    }
  }

  static async updateTime(timeRemaining: string): Promise<void> {
    try {
      await invoke('update_time', { timeRemaining });
    } catch (error) {
      console.error('Failed to update time:', error);
      throw error;
    }
  }

  static async updatePeriod(period: number): Promise<void> {
    try {
      await invoke('update_period', { period });
    } catch (error) {
      console.error('Failed to update period:', error);
      throw error;
    }
  }

  static async toggleGameActive(): Promise<boolean> {
    try {
      return await invoke('toggle_game_active');
    } catch (error) {
      console.error('Failed to toggle game active:', error);
      throw error;
    }
  }

  static async resetGame(): Promise<void> {
    try {
      await invoke('reset_game');
    } catch (error) {
      console.error('Failed to reset game:', error);
      throw error;
    }
  }

  static async updateTeamInfo(teamSide: 'home' | 'away', team: any): Promise<void> {
    try {
      await invoke('update_team_info', { teamSide, team });
    } catch (error) {
      console.error('Failed to update team info:', error);
      throw error;
    }
  }

  static async getCurrentWindow() {
    return getCurrentWebviewWindow();
  }

  // Live Data Commands
  static async fetchLiveData(apiUrl: string, apiKey: string): Promise<any> {
    try {
      return await invoke('fetch_live_data', { apiUrl, apiKey });
    } catch (error) {
      console.error('Failed to fetch live data:', error);
      throw error;
    }
  }

  static async testApiConnection(apiUrl: string, apiKey: string): Promise<boolean> {
    try {
      return await invoke('test_api_connection', { apiUrl, apiKey });
    } catch (error) {
      console.error('Failed to test API connection:', error);
      throw error;
    }
  }

  static async getAvailableScoreboards(apiUrl: string, apiKey: string): Promise<ScoreboardInfo[]> {
    try {
      return await invoke('get_available_scoreboards', { apiUrl, apiKey });
    } catch (error) {
      console.error('Failed to get available scoreboards:', error);
      throw error;
    }
  }

  // Live Data Connection Storage
  static async saveLiveDataConnections(connectionsData: LiveDataState): Promise<void> {
    try {
      return await invoke('save_live_data_connections', { connectionsData });
    } catch (error) {
      console.error('Failed to save live data connections:', error);
      throw error;
    }
  }

  static async loadLiveDataConnections(): Promise<LiveDataState> {
    try {
      return await invoke('load_live_data_connections');
    } catch (error) {
      console.error('Failed to load live data connections:', error);
      throw error;
    }
  }

  static async deleteLiveDataConnections(): Promise<void> {
    try {
      return await invoke('delete_live_data_connections');
    } catch (error) {
      console.error('Failed to delete live data connections:', error);
      throw error;
    }
  }

  // Export/Import Methods
  static async exportScoreboardAsZip(filename: string): Promise<number[]> {
    try {
      return await invoke('export_scoreboard_as_zip', { filename });
    } catch (error) {
      console.error('Failed to export scoreboard as zip:', error);
      throw error;
    }
  }

  static async importScoreboardFromZip(zipData: number[]): Promise<any> {
    try {
      return await invoke('import_scoreboard_from_zip', { zipData });
    } catch (error) {
      console.error('Failed to import scoreboard from zip:', error);
      throw error;
    }
  }
}

export interface ScoreboardInfo {
  id: string;
  name: string;
}

export interface MatchInfo {
  matchId: string;
  player1Name: string;
  player2Name: string;
  tournament: string;
  round: string;
  status: string;
}

export interface LiveDataConnectionData {
  id: string;
  name: string;
  provider: string;
  apiUrl: string;
  apiKey: string;
  pollInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
  lastError?: string;
}

export interface LiveDataBinding {
  componentId: string;
  connectionId: string;
  dataPath: string;
  updateInterval?: number;
}

export interface LiveDataState {
  connections: LiveDataConnectionData[];
  componentBindings: LiveDataBinding[];
}

// WebSocket Events for tennis-api
export enum TennisApiWebSocketEvents {
  SCOREBOARD_CREATED = 'scoreboard:created',
  SCOREBOARD_DELETED = 'scoreboard:deleted',
  SCOREBOARDS_UPDATED = 'scoreboards:updated',
  TENNIS_MATCH_CREATED = 'tennis:match:created',
  TENNIS_MATCH_UPDATED = 'tennis:match:updated',
  TENNIS_MATCH_DELETED = 'tennis:match:deleted',
}

export interface TennisApiScoreboard {
  id: string;
  name: string;
}

export interface TennisApiTennisMatch {
  id: string;
  scoreStringSide1: string;
  scoreStringSide2: string;
  side1PointScore: string;
  side2PointScore: string;
  sets: Array<{
    setNumber: number;
    side1Score: number;
    side2Score: number;
    winningSide?: number;
  }>;
  server: {
    sideNumber: number;
    playerNumber: number;
    returningSide: string;
  };
  player1Name?: string;
  player2Name?: string;
  scoreboardId: string;
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket Service for connecting to tennis-api
export class TennisApiWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(
    private apiUrl: string,
    private apiKey: string,
    private onConnected?: () => void,
    private onDisconnected?: () => void,
    private onScoreboardCreated?: (scoreboard: TennisApiScoreboard) => void,
    private onScoreboardDeleted?: (data: { id: string }) => void,
    private onScoreboardsUpdated?: (scoreboards: TennisApiScoreboard[]) => void,
    private onTennisMatchCreated?: (match: TennisApiTennisMatch) => void,
    private onTennisMatchUpdated?: (match: TennisApiTennisMatch) => void,
    private onTennisMatchDeleted?: (data: { id: string }) => void,
    private onError?: (error: any) => void
  ) {}

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log(`Connecting to tennis-api WebSocket at ${this.apiUrl}`);

    this.socket = io(this.apiUrl, {
      auth: {
        'x-api-key': this.apiKey
      },
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to tennis-api WebSocket');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from tennis-api WebSocket:', reason);
      this.onDisconnected?.();

      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Server disconnected us, don't try to reconnect
        return;
      }

      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.onError?.(error);
      this.attemptReconnect();
    });

    // Event listeners
    this.socket.on(TennisApiWebSocketEvents.SCOREBOARD_CREATED, (scoreboard: TennisApiScoreboard) => {
      console.log('Scoreboard created:', scoreboard);
      this.onScoreboardCreated?.(scoreboard);
    });

    this.socket.on(TennisApiWebSocketEvents.SCOREBOARD_DELETED, (data: { id: string }) => {
      console.log('Scoreboard deleted:', data.id);
      this.onScoreboardDeleted?.(data);
    });

    this.socket.on(TennisApiWebSocketEvents.SCOREBOARDS_UPDATED, (scoreboards: TennisApiScoreboard[]) => {
      console.log('Scoreboards updated:', scoreboards);
      this.onScoreboardsUpdated?.(scoreboards);
    });

    this.socket.on(TennisApiWebSocketEvents.TENNIS_MATCH_CREATED, (match: TennisApiTennisMatch) => {
      console.log('🔌 WebSocket received TENNIS_MATCH_CREATED:', match);
      console.log('🔌 WebSocket received match scoreboardId:', match.scoreboardId);
      this.onTennisMatchCreated?.(match);
    });

    this.socket.on(TennisApiWebSocketEvents.TENNIS_MATCH_UPDATED, (match: TennisApiTennisMatch) => {
      console.log('🔌 WebSocket received TENNIS_MATCH_UPDATED:', match);
      console.log('🔌 WebSocket received match scoreboardId:', match.scoreboardId);
      this.onTennisMatchUpdated?.(match);
    });

    this.socket.on(TennisApiWebSocketEvents.TENNIS_MATCH_DELETED, (data: { id: string }) => {
      console.log('Tennis match deleted:', data.id);
      this.onTennisMatchDeleted?.(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from tennis-api WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  // Method to manually trigger reconnection
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.connect();
  }

  // Method to create a new scoreboard
  async createScoreboard(name: string): Promise<TennisApiScoreboard> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Use HTTP request to create scoreboard
      const response = await fetch(`${this.apiUrl.replace('/socket.io', '')}/scoreboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Scoreboard created successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to create scoreboard:', error);
      throw error;
    }
  }

  // Method to delete a scoreboard
  async deleteScoreboard(id: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Use HTTP request to delete scoreboard
      const response = await fetch(`${this.apiUrl.replace('/socket.io', '')}/scoreboards/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Scoreboard deleted successfully:', result);
    } catch (error) {
      console.error('Failed to delete scoreboard:', error);
      throw error;
    }
  }

  // Method to fetch current scoreboards from API
  async getScoreboards(): Promise<TennisApiScoreboard[]> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      const response = await fetch(`${this.apiUrl.replace('/socket.io', '')}/scoreboards`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const scoreboards = await response.json();
      console.log('Scoreboards fetched from API:', scoreboards);
      return scoreboards;
    } catch (error) {
      console.error('Failed to fetch scoreboards:', error);
      throw error;
    }
  }

  // Method to send data to update scoreboards
  async updateScoreboards(scoreboards: TennisApiScoreboard[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Use HTTP request to update scoreboards since WebSocket is for real-time updates
      const response = await fetch(`${this.apiUrl.replace('/socket.io', '')}/scoreboards`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(scoreboards),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Scoreboards updated via HTTP:', result);
    } catch (error) {
      console.error('Failed to update scoreboards:', error);
      throw error;
    }
  }
} 