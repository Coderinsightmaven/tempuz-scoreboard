/**
 * CourtDataStorage - Utility class for storing and retrieving tennis court data.
 * 
 * Manages court data persistence in localStorage:
 * - Stores court data as JSON
 * - Tracks last update timestamp
 * - Provides methods to check data staleness
 * - Supports per-court data management
 * 
 * All data is stored in browser localStorage and persists across app restarts.
 */
// src/utils/courtDataStorage.ts
export interface CourtData {
  [courtName: string]: any;
}

/** localStorage key for court data */
const COURT_DATA_KEY = 'tennisCourtData';
/** localStorage key for last update timestamp */
const COURT_DATA_TIMESTAMP_KEY = 'tennisCourtDataTimestamp';

export class CourtDataStorage {
  /**
   * Stores court data in localStorage.
   * 
   * @param courtData - Object mapping court names to their data
   * 
   * Side effects:
   * - Saves data to localStorage
   * - Updates timestamp to current time
   */
  static storeCourtData(courtData: CourtData): void {
    try {
      localStorage.setItem(COURT_DATA_KEY, JSON.stringify(courtData));
      localStorage.setItem(COURT_DATA_TIMESTAMP_KEY, Date.now().toString());
      console.log('🏆 Stored court data for courts:', Object.keys(courtData));
    } catch (error) {
      console.error('❌ Failed to store court data:', error);
    }
  }

  /**
   * Gets all court data from localStorage.
   * 
   * @returns Object mapping court names to their data, or null if no data exists
   */
  static getCourtData(): CourtData | null {
    try {
      const data = localStorage.getItem(COURT_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to retrieve court data:', error);
      return null;
    }
  }

  /**
   * Gets data for a specific court by name.
   * 
   * @param courtName - Name of the court to get data for
   * @returns Court data object, or null if court not found
   */
  static getCourtDataByName(courtName: string): any | null {
    const allData = this.getCourtData();
    if (!allData) return null;

    return allData[courtName] || null;
  }

  /**
   * Gets the timestamp of the last data update.
   * 
   * @returns Timestamp in milliseconds since epoch, or null if no timestamp exists
   */
  static getLastUpdateTimestamp(): number | null {
    try {
      const timestamp = localStorage.getItem(COURT_DATA_TIMESTAMP_KEY);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('❌ Failed to get timestamp:', error);
      return null;
    }
  }

  /**
   * Checks if stored data is stale (older than specified age).
   * 
   * @param maxAgeMinutes - Maximum age in minutes before data is considered stale (default: 5)
   * @returns true if data is stale or doesn't exist, false if data is fresh
   */
  static isDataStale(maxAgeMinutes: number = 5): boolean {
    const timestamp = this.getLastUpdateTimestamp();
    if (!timestamp) return true;

    const age = Date.now() - timestamp;
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    return age > maxAge;
  }

  /**
   * Clears all court data from localStorage.
   * 
   * Side effects:
   * - Removes court data
   * - Removes timestamp
   */
  static clearCourtData(): void {
    try {
      localStorage.removeItem(COURT_DATA_KEY);
      localStorage.removeItem(COURT_DATA_TIMESTAMP_KEY);
      console.log('🗑️ Cleared all court data');
    } catch (error) {
      console.error('❌ Failed to clear court data:', error);
    }
  }

  /**
   * Gets list of all court names that have stored data.
   * 
   * @returns Array of court name strings
   */
  static getAvailableCourts(): string[] {
    const data = this.getCourtData();
    return data ? Object.keys(data) : [];
  }

  /**
   * Gets list of active courts (alias for getAvailableCourts).
   * 
   * @deprecated Use getAvailableCourts() instead
   * @returns Array of court name strings
   */
  static getActiveCourts(): string[] {
    return this.getAvailableCourts();
  }

  /**
   * Updates data for a specific court.
   * 
   * Merges new data with existing data for that court.
   * 
   * @param courtName - Name of the court to update
   * @param courtData - New data for the court
   * 
   * Side effects:
   * - Updates localStorage
   * - Updates timestamp
   */
  static updateCourtData(courtName: string, courtData: any): void {
    const allData = this.getCourtData() || {};
    allData[courtName] = courtData;
    this.storeCourtData(allData);
  }

  /**
   * Removes data for a specific court.
   * 
   * @param courtName - Name of the court to remove
   * 
   * Side effects:
   * - Removes court from localStorage
   * - Updates timestamp
   */
  static removeCourtData(courtName: string): void {
    const allData = this.getCourtData();
    if (allData && allData[courtName]) {
      delete allData[courtName];
      this.storeCourtData(allData);
    }
  }
}
