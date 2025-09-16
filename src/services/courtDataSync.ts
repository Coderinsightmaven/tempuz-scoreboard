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
   * Start the sync service
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
   * Stop the sync service
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
   * Get list of courts that are currently being displayed by active scoreboards
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
   * Clean up court data for courts that are no longer being displayed
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
   * Manually trigger a sync
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
   * Check if sync service is running
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
   * Get sync status
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
