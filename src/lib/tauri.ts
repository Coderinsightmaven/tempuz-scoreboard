// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { MonitorInfo } from '../types/tauri';
import { GameState } from '../types/scoreboard';

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

  // WebSocket Commands

  static async inspectLiveData(): Promise<string> {
    try {
      return await invoke('inspect_live_data');
    } catch (error) {
      throw error;
    }
  }

  static async checkWebSocketStatus(): Promise<string> {
    try {
      return await invoke('check_websocket_status');
    } catch (error) {
      throw error;
    }
  }

  static async testWebSocketConnection(wsUrl: string): Promise<string> {
    try {
      return await invoke('test_websocket_connection', { wsUrl });
    } catch (error) {
      throw error;
    }
  }

  static async connectWebSocket(wsUrl: string, connectionId: string, courtFilter?: string): Promise<string> {
    try {
      return await invoke('connect_websocket', { wsUrl, connectionId, courtFilter });
    } catch (error) {
      throw error;
    }
  }

  static async disconnectWebSocket(connectionId: string): Promise<string> {
    try {
      return await invoke('disconnect_websocket', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  static async sendWebSocketMessage(connectionId: string, message: string): Promise<string> {
    try {
      return await invoke('send_websocket_message', { connectionId, message });
    } catch (error) {
      throw error;
    }
  }

  static async startWebSocketListener(connectionId: string): Promise<string> {
    try {
      return await invoke('start_websocket_listener', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  static async stopWebSocketListener(connectionId: string): Promise<string> {
    try {
      return await invoke('stop_websocket_listener', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  static async getLatestIonCourtData(connectionId: string): Promise<any> {
    try {
      return await invoke('get_latest_ioncourt_data', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  static async getLatestIonCourtDataByCourt(courtName: string): Promise<any> {
    try {
      return await invoke('get_latest_ioncourt_data_by_court', { courtName });
    } catch (error) {
      throw error;
    }
  }

  static async getAllCourtData(): Promise<{[courtName: string]: any}> {
    try {
      return await invoke('get_all_court_data');
    } catch (error) {
      throw error;
    }
  }

  // Live Data Connection Storage
  static async saveLiveDataConnections(connectionsData: LiveDataState): Promise<void> {
    try {
      return await invoke('save_live_data_connections', { connectionsData });
    } catch (error) {
      throw error;
    }
  }

  static async loadLiveDataConnections(): Promise<LiveDataState> {
    try {
      return await invoke('load_live_data_connections');
    } catch (error) {
      throw error;
    }
  }

  static async deleteLiveDataConnections(): Promise<void> {
    try {
      return await invoke('delete_live_data_connections');
    } catch (error) {
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

