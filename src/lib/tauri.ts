// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { MonitorInfo } from '../types/tauri';
import { GameState } from '../types/scoreboard';

export interface TauriScoreboardConfig {
  id: string;
  name: string;
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
    offsetY: number = 0
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

  static async toggleScoreboardFullscreen(): Promise<void> {
    try {
      await invoke('toggle_scoreboard_fullscreen');
    } catch (error) {
      console.error('Failed to toggle scoreboard fullscreen:', error);
      throw error;
    }
  }

  // Storage Commands
  static async saveScoreboard(name: string, config: any): Promise<string> {
    try {
      return await invoke('save_scoreboard', { name, config });
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
} 