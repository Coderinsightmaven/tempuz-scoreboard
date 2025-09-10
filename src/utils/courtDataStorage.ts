// src/utils/courtDataStorage.ts
export interface CourtData {
  [courtName: string]: any;
}

const COURT_DATA_KEY = 'tennisCourtData';
const COURT_DATA_TIMESTAMP_KEY = 'tennisCourtDataTimestamp';

export class CourtDataStorage {
  /**
   * Store court data in localStorage
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
   * Get court data from localStorage
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
   * Get data for a specific court
   */
  static getCourtDataByName(courtName: string): any | null {
    const allData = this.getCourtData();
    if (!allData) return null;

    return allData[courtName] || null;
  }

  /**
   * Get timestamp of last data update
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
   * Check if data is stale (older than specified minutes)
   */
  static isDataStale(maxAgeMinutes: number = 5): boolean {
    const timestamp = this.getLastUpdateTimestamp();
    if (!timestamp) return true;

    const age = Date.now() - timestamp;
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    return age > maxAge;
  }

  /**
   * Clear all court data
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
   * Get list of available courts
   */
  static getAvailableCourts(): string[] {
    const data = this.getCourtData();
    return data ? Object.keys(data) : [];
  }

  /**
   * Update data for a specific court
   */
  static updateCourtData(courtName: string, courtData: any): void {
    const allData = this.getCourtData() || {};
    allData[courtName] = courtData;
    this.storeCourtData(allData);
  }

  /**
   * Remove data for a specific court
   */
  static removeCourtData(courtName: string): void {
    const allData = this.getCourtData();
    if (allData && allData[courtName]) {
      delete allData[courtName];
      this.storeCourtData(allData);
    }
  }
}
