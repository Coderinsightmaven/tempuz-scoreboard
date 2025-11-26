/**
 * TauriAPI - Wrapper class for all Tauri backend command invocations.
 * 
 * This class provides a unified interface for communicating with the Rust backend.
 * All methods are static and use Tauri's invoke system to call Rust commands.
 * 
 * Categories:
 * - Monitor management (get available monitors)
 * - Scoreboard window management (create, close, position, size)
 * - Storage operations (save, load, list, delete scoreboards)
 * - Game state management (update scores, time, period)
 * - WebSocket operations (connect, disconnect, send messages)
 * - Export/Import (ZIP file operations)
 * - Live data connection storage
 * 
 * All methods handle errors and log them to console.
 */
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
  // === Monitor Management ===
  
  /**
   * Gets list of available monitors from the system.
   * 
   * @returns Array of MonitorInfo objects with monitor details
   * Returns empty array on error
   */
  static async getMonitors(): Promise<MonitorInfo[]> {
    try {
      return await invoke('get_available_monitors');
    } catch (error) {
      console.error('Failed to get monitors:', error);
      return [];
    }
  }

  // === Scoreboard Window Management ===
  
  /**
   * Creates a new scoreboard display window on the specified monitor.
   * 
   * @param windowId - Unique identifier for the window
   * @param monitorId - ID of the monitor to display on
   * @param width - Window width in pixels
   * @param height - Window height in pixels
   * @param x - X coordinate on monitor
   * @param y - Y coordinate on monitor
   * @param offsetX - Additional X offset (default: 0)
   * @param offsetY - Additional Y offset (default: 0)
   * @param scoreboardData - Optional scoreboard data to display
   * 
   * @throws Error if window creation fails
   */
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

  /**
   * Closes a scoreboard display window.
   * 
   * @param windowId - ID of the window to close
   * @throws Error if window close fails
   */
  static async closeScoreboardWindow(windowId: string): Promise<void> {
    try {
      await invoke('close_scoreboard_window', { windowId });
    } catch (error) {
      console.error('Failed to close scoreboard window:', error);
      throw error;
    }
  }

  /**
   * Closes all scoreboard display windows.
   * 
   * @throws Error if close operation fails
   */
  static async closeAllScoreboardWindows(): Promise<void> {
    try {
      await invoke('close_all_scoreboard_windows');
    } catch (error) {
      console.error('Failed to close all scoreboard windows:', error);
      throw error;
    }
  }

  /**
   * Updates the position of a scoreboard window.
   * 
   * @param windowId - ID of the window to move
   * @param x - New X coordinate
   * @param y - New Y coordinate
   * @param offsetX - Additional X offset (default: 0)
   * @param offsetY - Additional Y offset (default: 0)
   * @throws Error if position update fails
   */
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

  /**
   * Updates the size of a scoreboard window.
   * 
   * @param windowId - ID of the window to resize
   * @param width - New width in pixels
   * @param height - New height in pixels
   * @throws Error if size update fails
   */
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

  /**
   * Lists all open scoreboard window IDs.
   * 
   * @returns Array of window ID strings
   * Returns empty array on error
   */
  static async listScoreboardWindows(): Promise<string[]> {
    try {
      return await invoke('list_scoreboard_windows');
    } catch (error) {
      console.error('Failed to list scoreboard windows:', error);
      return [];
    }
  }

  /**
   * Toggles fullscreen mode for a scoreboard window.
   * 
   * @param windowId - ID of the window to toggle
   * @throws Error if toggle fails
   */
  static async toggleScoreboardFullscreen(windowId: string): Promise<void> {
    try {
      await invoke('toggle_scoreboard_fullscreen', { windowId });
    } catch (error) {
      console.error('Failed to toggle scoreboard fullscreen:', error);
      throw error;
    }
  }

  /**
   * Sets fullscreen mode for a scoreboard window.
   * 
   * @param windowId - ID of the window
   * @param fullscreen - Whether window should be fullscreen
   * @throws Error if operation fails
   */
  static async setScoreboardFullscreen(windowId: string, fullscreen: boolean): Promise<void> {
    try {
      await invoke('set_scoreboard_fullscreen', { windowId, fullscreen });
    } catch (error) {
      console.error('Failed to set scoreboard fullscreen:', error);
      throw error;
    }
  }

  // === Storage Operations ===
  
  /**
   * Saves a scoreboard design to disk.
   * 
   * @param name - Name for the scoreboard
   * @param config - Scoreboard configuration and components data
   * @returns The filename where the scoreboard was saved
   * @throws Error if save fails
   */
  static async saveScoreboard(name: string, config: any): Promise<string> {
    try {
      return await invoke('save_scoreboard', { name, data: config });
    } catch (error) {
      console.error('Failed to save scoreboard:', error);
      throw error;
    }
  }

  /**
   * Loads a scoreboard design from disk.
   * 
   * @param filename - Filename of the scoreboard to load
   * @returns Scoreboard configuration object
   * @throws Error if load fails
   */
  static async loadScoreboard(filename: string): Promise<TauriScoreboardConfig> {
    try {
      return await invoke('load_scoreboard', { filename });
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
      throw error;
    }
  }

  /**
   * Lists all saved scoreboards.
   * 
   * @returns Array of scoreboard configuration objects
   * Returns empty array on error
   */
  static async listScoreboards(): Promise<TauriScoreboardConfig[]> {
    try {
      return await invoke('list_scoreboards');
    } catch (error) {
      console.error('Failed to list scoreboards:', error);
      return [];
    }
  }

  /**
   * Deletes a saved scoreboard from disk.
   * 
   * @param filename - Filename of the scoreboard to delete
   * @throws Error if deletion fails
   */
  static async deleteScoreboard(filename: string): Promise<void> {
    try {
      await invoke('delete_scoreboard', { filename });
    } catch (error) {
      console.error('Failed to delete scoreboard:', error);
      throw error;
    }
  }

  /**
   * Exports a scoreboard to a file path (legacy method).
   * 
   * @param filename - Filename of scoreboard to export
   * @param exportPath - Path where to save the export
   * @throws Error if export fails
   */
  static async exportScoreboard(filename: string, exportPath: string): Promise<void> {
    try {
      await invoke('export_scoreboard', { filename, exportPath });
    } catch (error) {
      console.error('Failed to export scoreboard:', error);
      throw error;
    }
  }

  /**
   * Imports a scoreboard from a file path (legacy method).
   * 
   * @param importPath - Path to the scoreboard file to import
   * @returns Imported scoreboard configuration
   * @throws Error if import fails
   */
  static async importScoreboard(importPath: string): Promise<TauriScoreboardConfig> {
    try {
      return await invoke('import_scoreboard', { importPath });
    } catch (error) {
      console.error('Failed to import scoreboard:', error);
      throw error;
    }
  }

  // === Game State Management ===
  
  /**
   * Updates the game state in the Rust backend.
   * 
   * @param gameState - Complete game state object
   * @throws Error if update fails
   */
  static async updateGameState(gameState: GameState): Promise<void> {
    try {
      await invoke('update_game_state', { gameState });
    } catch (error) {
      console.error('Failed to update game state:', error);
      throw error;
    }
  }

  /**
   * Gets the current game state from the Rust backend.
   * 
   * @returns Current game state, or null if not set or on error
   */
  static async getGameState(): Promise<GameState | null> {
    try {
      return await invoke('get_game_state');
    } catch (error) {
      console.error('Failed to get game state:', error);
      return null;
    }
  }

  /**
   * Updates the score for a team.
   * 
   * @param team - Either 'home' or 'away'
   * @param score - New score value
   * @throws Error if update fails
   */
  static async updateScore(team: 'home' | 'away', score: number): Promise<void> {
    try {
      await invoke('update_score', { team, score });
    } catch (error) {
      console.error('Failed to update score:', error);
      throw error;
    }
  }

  /**
   * Updates the time remaining in the game.
   * 
   * @param timeRemaining - Time string (e.g., "10:30")
   * @throws Error if update fails
   */
  static async updateTime(timeRemaining: string): Promise<void> {
    try {
      await invoke('update_time', { timeRemaining });
    } catch (error) {
      console.error('Failed to update time:', error);
      throw error;
    }
  }

  /**
   * Updates the current period/quarter.
   * 
   * @param period - Period number
   * @throws Error if update fails
   */
  static async updatePeriod(period: number): Promise<void> {
    try {
      await invoke('update_period', { period });
    } catch (error) {
      console.error('Failed to update period:', error);
      throw error;
    }
  }

  /**
   * Toggles whether the game is active (playing/paused).
   * 
   * @returns New active state (true/false)
   * @throws Error if toggle fails
   */
  static async toggleGameActive(): Promise<boolean> {
    try {
      return await invoke('toggle_game_active');
    } catch (error) {
      console.error('Failed to toggle game active:', error);
      throw error;
    }
  }

  /**
   * Resets the game state to initial values.
   * 
   * @throws Error if reset fails
   */
  static async resetGame(): Promise<void> {
    try {
      await invoke('reset_game');
    } catch (error) {
      console.error('Failed to reset game:', error);
      throw error;
    }
  }

  /**
   * Updates team information (name, logo, colors, etc.).
   * 
   * @param teamSide - Either 'home' or 'away'
   * @param team - Team information object
   * @throws Error if update fails
   */
  static async updateTeamInfo(teamSide: 'home' | 'away', team: any): Promise<void> {
    try {
      await invoke('update_team_info', { teamSide, team });
    } catch (error) {
      console.error('Failed to update team info:', error);
      throw error;
    }
  }

  /**
   * Gets the current webview window instance.
   * 
   * @returns Current Tauri webview window
   */
  static async getCurrentWindow() {
    return getCurrentWebviewWindow();
  }

  // === WebSocket Operations ===

  /**
   * Inspects live data state (for debugging).
   * 
   * @returns Debug string with live data information
   * @throws Error if inspection fails
   */
  static async inspectLiveData(): Promise<string> {
    try {
      return await invoke('inspect_live_data');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checks the status of WebSocket connections.
   * 
   * @returns Status string
   * @throws Error if check fails
   */
  static async checkWebSocketStatus(): Promise<string> {
    try {
      return await invoke('check_websocket_status');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tests a WebSocket connection without creating a persistent connection.
   * 
   * @param wsUrl - WebSocket URL to test
   * @returns Test result string
   * @throws Error if test fails
   */
  static async testWebSocketConnection(wsUrl: string): Promise<string> {
    try {
      return await invoke('test_websocket_connection', { wsUrl });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Connects to a WebSocket for live tennis data.
   * 
   * @param wsUrl - WebSocket URL
   * @param connectionId - Unique connection identifier
   * @param courtFilter - Optional court name filter for message filtering
   * @returns Connection result string
   * @throws Error if connection fails
   */
  static async connectWebSocket(wsUrl: string, connectionId: string, courtFilter?: string): Promise<string> {
    try {
      return await invoke('connect_websocket', { wsUrl, connectionId, courtFilter });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disconnects from a WebSocket connection.
   * 
   * @param connectionId - ID of connection to disconnect
   * @returns Disconnect result string
   * @throws Error if disconnect fails
   */
  static async disconnectWebSocket(connectionId: string): Promise<string> {
    try {
      return await invoke('disconnect_websocket', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sends a message through a WebSocket connection.
   * 
   * @param connectionId - ID of the connection
   * @param message - Message string to send
   * @returns Send result string
   * @throws Error if send fails
   */
  static async sendWebSocketMessage(connectionId: string, message: string): Promise<string> {
    try {
      return await invoke('send_websocket_message', { connectionId, message });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Starts listening for messages on a WebSocket connection.
   * 
   * @param connectionId - ID of the connection
   * @returns Start result string
   * @throws Error if start fails
   */
  static async startWebSocketListener(connectionId: string): Promise<string> {
    try {
      return await invoke('start_websocket_listener', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stops listening for messages on a WebSocket connection.
   * 
   * @param connectionId - ID of the connection
   * @returns Stop result string
   * @throws Error if stop fails
   */
  static async stopWebSocketListener(connectionId: string): Promise<string> {
    try {
      return await invoke('stop_websocket_listener', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets the latest IonCourt data for a connection.
   * 
   * @param connectionId - ID of the WebSocket connection
   * @returns Latest tennis data object
   * @throws Error if retrieval fails
   */
  static async getLatestIonCourtData(connectionId: string): Promise<any> {
    try {
      return await invoke('get_latest_ioncourt_data', { connectionId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets the latest IonCourt data for a specific court.
   * 
   * @param courtName - Name of the court to get data for
   * @returns Latest tennis data object for the court
   * @throws Error if retrieval fails
   */
  static async getLatestIonCourtDataByCourt(courtName: string): Promise<any> {
    try {
      return await invoke('get_latest_ioncourt_data_by_court', { courtName });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets data for all active courts (courts updated within last hour).
   * 
   * @returns Object mapping court names to their data
   * @throws Error if retrieval fails
   */
  static async getAllCourtData(): Promise<{[courtName: string]: any}> {
    try {
      // Note: This now only returns active courts (updated within last hour)
      return await invoke('get_active_court_data', { activeCourts: [] });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets data for all active courts only (courts updated within last hour).
   * 
   * @deprecated Use getAllCourtData() instead - it now only returns active courts
   * @returns Object mapping court names to their data
   * @throws Error if retrieval fails
   */
  static async getActiveCourtData(): Promise<{[courtName: string]: any}> {
    try {
      return await invoke('get_active_court_data', { activeCourts: [] });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets data for specific active courts only.
   * 
   * @param activeCourts - Array of court names to retrieve data for
   * @returns Object mapping court names to their data
   * @throws Error if retrieval fails
   */
  static async getActiveCourtDataForCourts(activeCourts: string[]): Promise<{[courtName: string]: any}> {
    try {
      return await invoke('get_active_court_data', { activeCourts });
    } catch (error) {
      throw error;
    }
  }

  // === Live Data Connection Storage ===
  
  /**
   * Saves live data connection configurations to persistent storage.
   * 
   * @param connectionsData - Live data state object with connections and bindings
   * @throws Error if save fails
   */
  static async saveLiveDataConnections(connectionsData: LiveDataState): Promise<void> {
    try {
      return await invoke('save_live_data_connections', { connectionsData });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Loads live data connection configurations from persistent storage.
   * 
   * @returns Live data state object with connections and bindings
   * @throws Error if load fails
   */
  static async loadLiveDataConnections(): Promise<LiveDataState> {
    try {
      return await invoke('load_live_data_connections');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes all saved live data connection configurations.
   * 
   * @throws Error if deletion fails
   */
  static async deleteLiveDataConnections(): Promise<void> {
    try {
      return await invoke('delete_live_data_connections');
    } catch (error) {
      throw error;
    }
  }

  // === Export/Import Operations ===
  
  /**
   * Exports a scoreboard as a ZIP file containing design and all assets.
   * 
   * @param filename - Filename of the scoreboard to export
   * @returns ZIP file data as array of bytes (numbers 0-255)
   * @throws Error if export fails
   */
  static async exportScoreboardAsZip(filename: string): Promise<number[]> {
    try {
      return await invoke('export_scoreboard_as_zip', { filename });
    } catch (error) {
      console.error('Failed to export scoreboard as zip:', error);
      throw error;
    }
  }

  /**
   * Imports a scoreboard from ZIP file data.
   * 
   * Extracts scoreboard design and all assets (images, videos) from ZIP.
   * 
   * @param zipData - ZIP file data as array of bytes (numbers 0-255)
   * @returns Imported scoreboard configuration
   * @throws Error if import fails
   */
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

