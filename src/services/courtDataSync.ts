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

    console.log('🚀 Starting court data sync service');
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
   * Manually trigger a sync
   */
  static async syncData(): Promise<void> {
    try {
      if (!window.__TAURI__ || !window.__TAURI__.core) {
        // console.log('Tauri not available, skipping sync');
        return;
      }

      const courtData = await TauriAPI.getAllCourtData();

      if (courtData && Object.keys(courtData).length > 0) {
        CourtDataStorage.storeCourtData(courtData);
        console.log('🔄 Synced court data:', Object.keys(courtData));
      } else {
        console.log('🔄 No court data to sync');
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
    availableCourts: string[];
    isDataStale: boolean;
  } {
    return {
      isRunning: this.isRunning,
      lastUpdate: CourtDataStorage.getLastUpdateTimestamp(),
      availableCourts: CourtDataStorage.getAvailableCourts(),
      isDataStale: CourtDataStorage.isDataStale()
    };
  }
}
