/**
 * RustTennisProcessor - Service for processing tennis data via Rust backend.
 * 
 * This service provides high-performance tennis data processing by leveraging
 * the Rust backend instead of JavaScript Web Workers. The Rust backend can
 * handle complex data transformations and validations more efficiently.
 * 
 * Features:
 * - Single match processing
 * - Batch processing for multiple matches
 * - Data validation
 * - Configurable debug logging
 * 
 * All processing happens asynchronously via Tauri's invoke system.
 */
// src/services/rustTennisProcessor.ts
import { invoke } from '@tauri-apps/api/core';
import {
  RawTennisData,
  ProcessedTennisMatch,
  ProcessTennisDataResponse,
  ProcessBatchResponse,
  ValidateTennisDataResponse
} from '../types/tennisProcessor';

// Re-export ProcessedTennisMatch for backwards compatibility
export type { ProcessedTennisMatch };

export interface RustProcessorConfig {
  /** Enable debug logging for processing operations */
  enableDebugLogging?: boolean;
}

/**
 * RustTennisProcessor class for processing tennis match data via Rust backend.
 * 
 * This class provides methods to process, validate, and batch process tennis data.
 * All operations are performed in the Rust backend for better performance.
 */
export class RustTennisProcessor {
  private config: Required<RustProcessorConfig>;

  /**
   * Creates a new RustTennisProcessor instance.
   * 
   * @param config - Configuration options for the processor
   */
  constructor(config: RustProcessorConfig = {}) {
    this.config = {
      enableDebugLogging: false,
      ...config
    };
  }

  /**
   * Processes a single tennis match data through the Rust backend.
   * 
   * The Rust backend:
   * - Validates the data structure
   * - Transforms raw data into processed format
   * - Calculates derived values (set scores, match status, etc.)
   * - Returns structured ProcessedTennisMatch object
   * 
   * @param rawData - Raw tennis data from API/WebSocket
   * @returns Processed tennis match data
   * 
   * @throws Error if processing fails
   */
  async processData(rawData: RawTennisData): Promise<ProcessedTennisMatch> {
    try {
      if (this.config.enableDebugLogging) {
        console.log('🏗️ Processing tennis data via Rust backend:', rawData);
      }

      const result = await invoke<ProcessTennisDataResponse>('process_tennis_data', {
        rawData: rawData as any // Type assertion needed for Tauri invoke
      });

      if (this.config.enableDebugLogging) {
        console.log('✅ Rust backend processed data:', result);
      }

      // The response is already in the correct format from Rust backend
      return result as ProcessedTennisMatch;

    } catch (error) {
      console.error('❌ Rust backend processing failed:', error);
      throw new Error(`Rust backend processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Processes multiple tennis matches in batch through the Rust backend.
   * 
   * More efficient than processing matches individually, especially for large datasets.
   * 
   * @param rawDataBatch - Array of raw tennis data objects
   * @returns Array of processed tennis match data
   * 
   * @throws Error if batch processing fails
   */
  async processBatch(rawDataBatch: RawTennisData[]): Promise<ProcessedTennisMatch[]> {
    try {
      if (this.config.enableDebugLogging) {
        console.log(`🏗️ Batch processing ${rawDataBatch.length} matches via Rust backend`);
      }

      const result = await invoke<ProcessBatchResponse>('process_tennis_data_batch', {
        rawDataBatch: rawDataBatch as any[]
      });

      if (this.config.enableDebugLogging) {
        console.log(`✅ Rust backend processed ${result.data.length} matches`);
      }

      // The responses are already in the correct format from Rust backend
      return result.data as ProcessedTennisMatch[];

    } catch (error) {
      console.error('❌ Rust backend batch processing failed:', error);
      throw new Error(`Rust backend batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates tennis data structure through the Rust backend.
   * 
   * Checks that the data has required fields and valid structure before processing.
   * 
   * @param rawData - Raw tennis data to validate
   * @returns true if data is valid, false otherwise
   * 
   * Note: Returns false if validation fails or throws an error.
   */
  async validateData(rawData: RawTennisData): Promise<boolean> {
    try {
      const result = await invoke<ValidateTennisDataResponse>('validate_tennis_data', {
        rawData: rawData as any
      });

      return result.isValid;

    } catch (error) {
      console.error('❌ Rust backend validation failed:', error);
      return false;
    }
  }


  /**
   * Updates the processor configuration.
   * 
   * @param newConfig - Partial configuration object to merge with existing config
   */
  updateConfig(newConfig: Partial<RustProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableDebugLogging) {
      console.log('⚙️ Rust processor config updated:', this.config);
    }
  }
}

// === Singleton Instance Management ===

/**
 * Singleton instance of RustTennisProcessor.
 * Ensures only one processor instance exists for efficiency.
 */
let rustProcessorInstance: RustTennisProcessor | null = null;

/**
 * Gets the singleton Rust tennis processor instance.
 * Creates a new instance if one doesn't exist.
 * 
 * @param config - Optional configuration (only used on first creation)
 * @returns The singleton RustTennisProcessor instance
 */
export const getRustTennisProcessor = (config?: RustProcessorConfig): RustTennisProcessor => {
  if (!rustProcessorInstance) {
    rustProcessorInstance = new RustTennisProcessor(config);
  }
  return rustProcessorInstance;
};

/**
 * Initializes the Rust tennis processor with default configuration.
 * Alias for getRustTennisProcessor for clarity.
 * 
 * @param config - Optional configuration
 * @returns The RustTennisProcessor instance
 */
export const initializeRustTennisProcessor = (config?: RustProcessorConfig): RustTennisProcessor => {
  return getRustTennisProcessor(config);
};

// === Convenience Functions ===

/**
 * Processes tennis data using the Rust backend (convenience function).
 * Uses the singleton processor instance.
 * 
 * @param rawData - Raw tennis data to process
 * @returns Processed tennis match data
 */
export const processTennisDataViaRust = async (rawData: RawTennisData): Promise<ProcessedTennisMatch> => {
  const processor = getRustTennisProcessor();
  return processor.processData(rawData);
};

/**
 * Processes multiple tennis matches using the Rust backend (convenience function).
 * Uses the singleton processor instance.
 * 
 * @param rawDataBatch - Array of raw tennis data to process
 * @returns Array of processed tennis match data
 */
export const processTennisDataBatchViaRust = async (rawDataBatch: RawTennisData[]): Promise<ProcessedTennisMatch[]> => {
  const processor = getRustTennisProcessor();
  return processor.processBatch(rawDataBatch);
};

/**
 * Validates tennis data using the Rust backend (convenience function).
 * Uses the singleton processor instance.
 * 
 * @param rawData - Raw tennis data to validate
 * @returns true if data is valid, false otherwise
 */
export const validateTennisDataViaRust = async (rawData: RawTennisData): Promise<boolean> => {
  const processor = getRustTennisProcessor();
  return processor.validateData(rawData);
};
