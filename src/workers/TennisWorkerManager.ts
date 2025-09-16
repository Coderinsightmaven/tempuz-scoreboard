import { TennisWorkerMessage, TennisWorkerResponse } from './tennisDataWorker';

export interface TennisWorkerConfig {
  debounceMs?: number;
  enableDebugLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ProcessedTennisMatch {
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
    player1_sets: number;
    player2_sets: number;
    player1_games: number;
    player2_games: number;
    player1_points: string;
    player2_points: string;
  };
  sets: Record<string, { player1: number; player2: number }>;
  servingPlayer: 1 | 2 | 3 | 4;
  currentSet: number;
  isTiebreak: boolean;
  matchStatus: 'in_progress' | 'completed';
  // Legacy properties for compatibility
  serving_player: number;
}

export class TennisWorkerManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private pendingRequests = new Map<string, {
    resolve: (value: ProcessedTennisMatch) => void;
    reject: (error: Error) => void;
    timeout: number;
  }>();
  private config: Required<TennisWorkerConfig>;
  private requestId = 0;

  constructor(config: TennisWorkerConfig = {}) {
    this.config = {
      debounceMs: 100,
      enableDebugLogging: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create the Web Worker
      this.worker = new Worker(new URL('./tennisDataWorker.ts', import.meta.url), {
        type: 'module'
      });

      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Wait for worker to be ready
      await this.waitForWorkerReady();

      // Configure the worker
      await this.sendMessage({
        type: 'UPDATE_CONFIG',
        payload: {
          debounceMs: this.config.debounceMs,
          enableDebugLogging: this.config.enableDebugLogging
        }
      });

      this.isInitialized = true;
      this.log('TennisWorkerManager initialized successfully');

    } catch (error) {
      this.log('Failed to initialize worker:', error);
      throw new Error(`Failed to initialize tennis data worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processTennisData(rawData: any): Promise<ProcessedTennisMatch> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    const requestId = `req_${++this.requestId}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Worker request timeout'));
      }, 5000); // 5 second timeout

      // Store the promise handlers
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout
      });

      // Send the processing request
      this.sendMessage({
        type: 'PROCESS_DATA',
        payload: rawData
      });
    });
  }

  async updateConfig(newConfig: Partial<TennisWorkerConfig>): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    this.config = { ...this.config, ...newConfig };

    await this.sendMessage({
      type: 'UPDATE_CONFIG',
      payload: {
        debounceMs: this.config.debounceMs,
        enableDebugLogging: this.config.enableDebugLogging
      }
    });
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      // Clear all pending requests
    for (const handlers of this.pendingRequests.values()) {
      clearTimeout(handlers.timeout);
      handlers.reject(new Error('Worker terminated'));
    }
      this.pendingRequests.clear();

      // Send stop message and terminate
      try {
        await this.sendMessage({ type: 'STOP_PROCESSING' });
      } catch (error) {
        // Ignore errors during shutdown
      }

      this.worker.terminate();
      this.worker = null;
    }

    this.isInitialized = false;
    this.log('TennisWorkerManager terminated');
  }

  private async sendMessage(message: TennisWorkerMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 2000);

      try {
        this.worker.postMessage(message);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  private handleWorkerMessage(event: MessageEvent<TennisWorkerResponse>) {
    const { type, payload, error } = event.data;

    switch (type) {
      case 'DATA_PROCESSED':
        // Resolve the pending request with processed data
        if (payload && this.pendingRequests.size > 0) {
          // For simplicity, resolve the first pending request
          // In a production app, you'd want to match by request ID
          const firstEntry = this.pendingRequests.entries().next().value;
          if (firstEntry) {
            const [firstRequestId, handlers] = firstEntry;
            if (handlers) {
              clearTimeout(handlers.timeout);
              this.pendingRequests.delete(firstRequestId);
              handlers.resolve(payload);
            }
          }
        }
        break;

      case 'ERROR':
        // Reject the pending request with error
        if (this.pendingRequests.size > 0) {
          const firstEntry = this.pendingRequests.entries().next().value;
          if (firstEntry) {
            const [firstRequestId, handlers] = firstEntry;
            if (handlers) {
              clearTimeout(handlers.timeout);
              this.pendingRequests.delete(firstRequestId);
              handlers.reject(new Error(error || 'Worker processing error'));
            }
          }
        }
        break;

      case 'READY':
        // Worker is ready - this is handled in waitForWorkerReady
        break;

      default:
        this.log('Unknown worker message type:', type);
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    this.log('Worker error:', error);

    // Reject all pending requests
    for (const handlers of this.pendingRequests.values()) {
      clearTimeout(handlers.timeout);
      handlers.reject(new Error(`Worker error: ${error.message}`));
    }
    this.pendingRequests.clear();
  }

  private async waitForWorkerReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 5000);

      const readyHandler = (event: MessageEvent<TennisWorkerResponse>) => {
        if (event.data.type === 'READY') {
          this.worker!.removeEventListener('message', readyHandler);
          clearTimeout(timeout);
          resolve();
        }
      };

      this.worker.addEventListener('message', readyHandler);
    });
  }

  private log(...args: any[]) {
    if (this.config.enableDebugLogging) {
      console.log('[TennisWorkerManager]', ...args);
    }
  }
}

// Singleton instance for easy access
let workerManagerInstance: TennisWorkerManager | null = null;

export const getTennisWorkerManager = (config?: TennisWorkerConfig): TennisWorkerManager => {
  if (!workerManagerInstance) {
    workerManagerInstance = new TennisWorkerManager(config);
  }
  return workerManagerInstance;
};

export const initializeTennisWorker = async (config?: TennisWorkerConfig): Promise<TennisWorkerManager> => {
  const manager = getTennisWorkerManager(config);
  await manager.initialize();
  return manager;
};

export const terminateTennisWorker = async (): Promise<void> => {
  if (workerManagerInstance) {
    await workerManagerInstance.terminate();
    workerManagerInstance = null;
  }
};
