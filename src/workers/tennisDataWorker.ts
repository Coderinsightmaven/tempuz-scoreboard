// Web Worker for processing tennis data to prevent UI blocking
export interface TennisWorkerMessage {
  type: 'PROCESS_DATA' | 'UPDATE_CONFIG' | 'STOP_PROCESSING';
  payload?: any;
}

export interface TennisWorkerResponse {
  type: 'DATA_PROCESSED' | 'ERROR' | 'READY';
  payload?: any;
  error?: string;
}

// Tennis match data structure for processing
interface ProcessedTennisMatch {
  matchId: string;
  player1: {
    name: string;
    country?: string;
    seed?: number;
  };
  player2: {
    name: string;
    country?: string;
    seed?: number;
  };
  score: {
    player1Sets: number;
    player2Sets: number;
    player1Games: number;
    player2Games: number;
    player1Points: string;
    player2Points: string;
    // Legacy properties for compatibility
    player1_sets?: number;
    player2_sets?: number;
    player1_games?: number;
    player2_games?: number;
    player1_points?: string;
    player2_points?: string;
  };
  sets: Record<string, { player1: number; player2: number }>;
  servingPlayer: number;
  currentSet: number;
  isTiebreak: boolean;
  matchStatus: 'in_progress' | 'completed';
}

// Worker configuration
interface WorkerConfig {
  debounceMs: number;
  enableDebugLogging: boolean;
}

class TennisDataProcessor {
  private config: WorkerConfig = {
    debounceMs: 100,
    enableDebugLogging: false
  };

  constructor() {
    this.log('TennisDataProcessor initialized');
  }

  updateConfig(newConfig: Partial<WorkerConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated:', this.config);
  }

  processData(rawData: any): ProcessedTennisMatch | null {
    try {
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid data format');
      }

      // Extract score data with fallbacks
      const player1Sets = rawData.score?.player1Sets || rawData.score?.player1_sets || 0;
      const player2Sets = rawData.score?.player2Sets || rawData.score?.player2_sets || 0;
      const player1Games = rawData.score?.player1Games || rawData.score?.player1_games || 0;
      const player2Games = rawData.score?.player2Games || rawData.score?.player2_games || 0;
      const player1Points = this.normalizePoints(rawData.score?.player1Points || rawData.score?.player1_points || '0');
      const player2Points = this.normalizePoints(rawData.score?.player2Points || rawData.score?.player2_points || '0');
      const servingPlayer = (rawData.servingPlayer || rawData.serving_player || 1) as 1 | 2 | 3 | 4;

      // Process raw tennis data into structured format
      const processedData: ProcessedTennisMatch = {
        matchId: rawData.matchId || rawData.id || 'unknown',
        player1: {
          name: rawData.player1?.name || rawData.team1?.name || 'Player 1',
          country: rawData.player1?.country,
          seed: rawData.player1?.seed
        },
        player2: {
          name: rawData.player2?.name || rawData.team2?.name || 'Player 2',
          country: rawData.player2?.country,
          seed: rawData.player2?.seed
        },
        score: {
          player1Sets,
          player2Sets,
          player1Games,
          player2Games,
          player1Points,
          player2Points,
          // Legacy property names for compatibility
          player1_sets: player1Sets,
          player2_sets: player2Sets,
          player1_games: player1Games,
          player2_games: player2Games,
          player1_points: player1Points,
          player2_points: player2Points
        },
        sets: this.processSetsData(rawData.sets || {}),
        servingPlayer,
        currentSet: rawData.currentSet || rawData.current_set || 1,
        isTiebreak: rawData.isTiebreak || rawData.is_tiebreak || false,
        matchStatus: rawData.matchStatus || rawData.match_status || 'in_progress'
      };

      this.log('Data processed successfully:', processedData.matchId);
      return processedData;

    } catch (error) {
      this.log('Error processing tennis data:', error);
      throw error;
    }
  }

  private normalizePoints(points: string | number): string {
    if (typeof points === 'number') {
      return points.toString();
    }

    // Standardize point values
    const pointMap: Record<string, string> = {
      '0': '0',
      '15': '15',
      '30': '30',
      '40': '40',
      'A': 'AD',
      'AD': 'AD',
      'advantage': 'AD',
      'love': '0'
    };

    return pointMap[points.toLowerCase()] || points;
  }

  private processSetsData(rawSets: any): Record<string, { player1: number; player2: number }> {
    const processedSets: Record<string, { player1: number; player2: number }> = {};

    Object.entries(rawSets).forEach(([setKey, setData]: [string, any]) => {
      if (setData && typeof setData === 'object') {
        processedSets[setKey] = {
          player1: setData.player1 || setData.player1_games || 0,
          player2: setData.player2 || setData.player2_games || 0
        };
      }
    });

    return processedSets;
  }

  private log(...args: any[]) {
    if (this.config.enableDebugLogging) {
      console.log('[TennisDataProcessor]', ...args);
    }
  }
}

// Worker instance
const processor = new TennisDataProcessor();

// Handle messages from main thread
self.onmessage = (event: MessageEvent<TennisWorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'PROCESS_DATA':
        const processedData = processor.processData(payload);
        self.postMessage({
          type: 'DATA_PROCESSED',
          payload: processedData
        } as TennisWorkerResponse);
        break;

      case 'UPDATE_CONFIG':
        processor.updateConfig(payload);
        self.postMessage({
          type: 'READY'
        } as TennisWorkerResponse);
        break;

      case 'STOP_PROCESSING':
        // Clean up and signal completion
        self.postMessage({
          type: 'READY'
        } as TennisWorkerResponse);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      payload: event.data
    } as TennisWorkerResponse);
  }
};

// Signal that worker is ready
self.postMessage({
  type: 'READY'
} as TennisWorkerResponse);
