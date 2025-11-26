/**
 * CourtDataSyncService - Service for synchronizing tennis court data from external sources.
 * 
 * This service:
 * - Manages periodic data synchronization via Rust backend
 * - Tracks which courts are actively being displayed
 * - Cleans up data for courts no longer in use
 * - Provides status information about sync operations
 * 
 * The sync service runs in the Rust backend and periodically fetches tennis data
 * for courts that are currently being displayed on scoreboard windows.
 */
// src/services/courtDataSync.ts
import { invoke } from '@tauri-apps/api/core';
import { CourtDataStorage } from '../utils/courtDataStorage';
import { useAppStore } from '../stores/useAppStore';

// Extend window interface to include Tauri
declare global {
  interface Window {
    __TAURI__?: {
      core?: any;
    };
  }
}

export class CourtDataSyncService {
  private static isRunning = false;

  /**
   * Starts the court data synchronization service.
   * 
   * The service runs in the Rust backend and periodically fetches tennis data
   * for active courts. Data is stored and made available to scoreboard components.
   * 
   * @param intervalMs - Polling interval in milliseconds (default: 2000ms = 2 seconds)
   * 
   * Side effects:
   * - Starts background sync process in Rust backend
   * - Updates isRunning flag
   * - Begins periodic data fetching for active courts
   * 
   * @throws Error if sync service fails to start
   */
  static async startSync(intervalMs: number = 2000): Promise<void> {
    try {
      console.log('🚀 Starting court data sync service (Rust backend)');
      const result = await invoke<string>('start_court_data_sync', { intervalMs });
      console.log('✅', result);
      this.isRunning = true;
    } catch (error) {
      console.error('❌ Failed to start court data sync:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stops the court data synchronization service.
   * 
   * Side effects:
   * - Stops background sync process in Rust backend
   * - Updates isRunning flag
   * - Stops periodic data fetching
   * 
   * @throws Error if sync service fails to stop
   */
  static async stopSync(): Promise<void> {
    try {
      console.log('🛑 Stopping court data sync service (Rust backend)');
      const result = await invoke<string>('stop_court_data_sync');
      console.log('✅', result);
      this.isRunning = false;
    } catch (error) {
      console.error('❌ Failed to stop court data sync:', error);
      throw error;
    }
  }

  /**
   * Gets a list of courts that are currently being displayed by active scoreboard windows.
   * 
   * This method:
   * 1. Queries the app store for active scoreboard instances
   * 2. Extracts court filters from each active instance
   * 3. Returns unique court names
   * 
   * @returns Array of court names (strings) that are currently displayed
   * 
   * Note: Only returns courts from active (visible) scoreboard instances.
   * Used to determine which courts need data synchronization.
   */
  static getActiveDisplayedCourts(): string[] {
    try {
      // Get the app state to access scoreboard instances
      const appState = useAppStore.getState();

      const activeCourts: string[] = [];

      // Get court filters from active scoreboard instances
      for (const instance of appState.scoreboardInstances) {
        if (instance.isActive && instance.scoreboardData?.courtFilter) {
          const courtFilter = instance.scoreboardData.courtFilter.trim();
          if (courtFilter && !activeCourts.includes(courtFilter)) {
            activeCourts.push(courtFilter);
          }
        }
      }

      console.log('📺 Found active courts being displayed:', activeCourts);
      return activeCourts;
    } catch (error) {
      console.warn('⚠️  Failed to get active displayed courts:', error);
      return [];
    }
  }

  /**
   * Cleans up court data for courts that are no longer being displayed.
   * 
   * This method:
   * 1. Gets all stored courts from CourtDataStorage
   * 2. Compares with actively displayed courts
   * 3. Removes data for courts that are no longer displayed
   * 
   * @param activeDisplayedCourts - Array of court names currently being displayed
   * 
   * Side effects:
   * - Removes court data from storage for undisplayed courts
   * - Frees up memory by cleaning unused data
   */
  static cleanupUndisplayedCourtData(activeDisplayedCourts: string[]): void {
    try {
      const allStoredCourts = CourtDataStorage.getActiveCourts();
      const courtsToRemove: string[] = [];

      // Find courts that are stored but not being displayed
      for (const storedCourt of allStoredCourts) {
        if (!activeDisplayedCourts.includes(storedCourt)) {
          courtsToRemove.push(storedCourt);
        }
      }

      if (courtsToRemove.length > 0) {
        console.log('🧹 Cleaning up data for undisplayed courts:', courtsToRemove);
        for (const courtName of courtsToRemove) {
          CourtDataStorage.removeCourtData(courtName);
        }
        console.log(`🧹 Removed data for ${courtsToRemove.length} undisplayed courts`);
      } else {
        console.log('✅ No undisplayed courts to clean up');
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup undisplayed court data:', error);
    }
  }

  /**
   * Manually triggers a court data synchronization.
   * 
   * Forces an immediate sync of all active courts, bypassing the normal interval.
   * Useful for testing or when immediate data refresh is needed.
   * 
   * @throws Error if manual sync fails
   */
  static async syncData(): Promise<void> {
    try {
      console.log('🔄 Triggering manual court data sync (Rust backend)');
      const result = await invoke<string>('trigger_manual_sync');
      console.log('✅', result);
    } catch (error) {
      console.error('❌ Failed to trigger manual sync:', error);
      throw error;
    }
  }

  /**
   * Checks if the sync service is currently running.
   * 
   * @returns true if sync service is active, false otherwise
   */
  static async isSyncRunning(): Promise<boolean> {
    try {
      const result = await invoke<boolean>('is_court_sync_running');
      this.isRunning = result;
      return result;
    } catch (error) {
      console.error('❌ Failed to check sync status:', error);
      return false;
    }
  }

  /**
   * Gets comprehensive status information about the sync service.
   * 
   * Returns:
   * - Whether sync is running
   * - Last update timestamp
   * - Active courts (from Rust backend)
   * - Displayed courts (from frontend)
   * - Whether data is stale (older than 5 minutes)
   * 
   * @returns Status object with sync information
   * 
   * Note: Falls back to basic status if Rust backend query fails.
   */
  static async getSyncStatus(): Promise<{
    isRunning: boolean;
    lastUpdate: number | null;
    activeCourts: string[];
    displayedCourts: string[];
    isDataStale: boolean;
  }> {
    try {
      const rustStatus = await invoke<{
        isRunning: boolean;
        intervalMs: number;
        lastSync: string | null;
        activeCourts: string[];
        storedCourts: string[];
        errorCount: number;
      }>('get_court_sync_status');

      // Convert Rust timestamp to JavaScript timestamp
      let lastUpdate: number | null = null;
      if (rustStatus.lastSync) {
        lastUpdate = new Date(rustStatus.lastSync).getTime();
      }

      // Check if data is stale (older than 5 minutes)
      const isDataStale = lastUpdate ? (Date.now() - lastUpdate) > (5 * 60 * 1000) : true;

      return {
        isRunning: rustStatus.isRunning,
        lastUpdate,
        activeCourts: rustStatus.activeCourts,
        displayedCourts: this.getActiveDisplayedCourts(),
        isDataStale
      };
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      // Fallback to basic status
      return {
        isRunning: this.isRunning,
        lastUpdate: CourtDataStorage.getLastUpdateTimestamp(),
        activeCourts: CourtDataStorage.getActiveCourts(),
        displayedCourts: this.getActiveDisplayedCourts(),
        isDataStale: CourtDataStorage.isDataStale()
      };
    }
  }
}
