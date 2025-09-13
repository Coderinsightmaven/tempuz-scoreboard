// src/services/courtDataSync.ts
import { TauriAPI } from '../lib/tauri';
import { CourtDataStorage } from '../utils/courtDataStorage';

// Extend window interface to include Tauri
declare global {
  interface Window {
    __TAURI__?: {
      core?: any;
    };
  }
}

export class CourtDataSyncService {
  private static syncInterval: number | null = null;
  private static isRunning = false;

  /**
   * Start the sync service
   */
  static startSync(intervalMs: number = 2000): void {
    if (this.isRunning) {
      console.log('🔄 Court data sync already running');
      return;
    }

    console.log('🚀 Starting active court data sync service');
    this.isRunning = true;

    // Initial sync
    this.syncData();

    // Set up periodic sync
    this.syncInterval = window.setInterval(() => {
      this.syncData();
    }, intervalMs);
  }

  /**
   * Stop the sync service
   */
  static stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('🛑 Stopped court data sync service');
    }
  }

  /**
   * Get list of courts that are currently being displayed by active scoreboards
   */
  static getActiveDisplayedCourts(): string[] {
    try {
      // Import the app store dynamically to avoid circular dependencies
      const { useAppStore } = require('../stores/useAppStore');
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
      if (!window.__TAURI__ || !window.__TAURI__.core) {
        // console.log('Tauri not available, skipping sync');
        return;
      }

      // Get courts that are currently being displayed by scoreboards
      const activeDisplayedCourts = this.getActiveDisplayedCourts();

      let courtData: {[courtName: string]: any};

      if (activeDisplayedCourts.length > 0) {
        // Only fetch data for courts that are being actively displayed
        console.log('🎯 Requesting data for active displayed courts:', activeDisplayedCourts);
        courtData = await TauriAPI.getActiveCourtDataForCourts(activeDisplayedCourts);
      } else {
        // Fallback to time-based filtering if no courts are being displayed
        console.log('⚠️  No active scoreboards found, falling back to time-based filtering');
        courtData = await TauriAPI.getActiveCourtData();
      }

      if (courtData && Object.keys(courtData).length > 0) {
        CourtDataStorage.storeCourtData(courtData);
        console.log('🔄 Synced active court data:', Object.keys(courtData));

        // Clean up data for courts that are no longer being displayed
        this.cleanupUndisplayedCourtData(activeDisplayedCourts);
      } else {
        console.log('🔄 No active court data to sync');
      }
    } catch (error) {
      console.error('❌ Failed to sync court data:', error);
    }
  }

  /**
   * Check if sync service is running
   */
  static isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get sync status
   */
  static getSyncStatus(): {
    isRunning: boolean;
    lastUpdate: number | null;
    activeCourts: string[];
    displayedCourts: string[];
    isDataStale: boolean;
  } {
    return {
      isRunning: this.isRunning,
      lastUpdate: CourtDataStorage.getLastUpdateTimestamp(),
      activeCourts: CourtDataStorage.getActiveCourts(),
      displayedCourts: this.getActiveDisplayedCourts(),
      isDataStale: CourtDataStorage.isDataStale()
    };
  }
}
