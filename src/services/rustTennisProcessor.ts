// src/services/rustTennisProcessor.ts
// Service for calling Rust backend tennis data processing instead of Web Workers

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
  enableDebugLogging?: boolean;
}

export class RustTennisProcessor {
  private config: Required<RustProcessorConfig>;

  constructor(config: RustProcessorConfig = {}) {
    this.config = {
      enableDebugLogging: false,
      ...config
    };
  }

  /**
   * Process a single tennis match data through the Rust backend
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
   * Process multiple tennis matches in batch through the Rust backend
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
   * Validate tennis data structure through the Rust backend
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
   * Update processor configuration
   */
  updateConfig(newConfig: Partial<RustProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableDebugLogging) {
      console.log('⚙️ Rust processor config updated:', this.config);
    }
  }
}

// Singleton instance
let rustProcessorInstance: RustTennisProcessor | null = null;

/**
 * Get the singleton Rust tennis processor instance
 */
export const getRustTennisProcessor = (config?: RustProcessorConfig): RustTennisProcessor => {
  if (!rustProcessorInstance) {
    rustProcessorInstance = new RustTennisProcessor(config);
  }
  return rustProcessorInstance;
};

/**
 * Initialize the Rust tennis processor with default configuration
 */
export const initializeRustTennisProcessor = (config?: RustProcessorConfig): RustTennisProcessor => {
  return getRustTennisProcessor(config);
};

/**
 * Process tennis data using the Rust backend
 */
export const processTennisDataViaRust = async (rawData: RawTennisData): Promise<ProcessedTennisMatch> => {
  const processor = getRustTennisProcessor();
  return processor.processData(rawData);
};

/**
 * Process multiple tennis matches using the Rust backend
 */
export const processTennisDataBatchViaRust = async (rawDataBatch: RawTennisData[]): Promise<ProcessedTennisMatch[]> => {
  const processor = getRustTennisProcessor();
  return processor.processBatch(rawDataBatch);
};

/**
 * Validate tennis data using the Rust backend
 */
export const validateTennisDataViaRust = async (rawData: RawTennisData): Promise<boolean> => {
  const processor = getRustTennisProcessor();
  return processor.validateData(rawData);
};
