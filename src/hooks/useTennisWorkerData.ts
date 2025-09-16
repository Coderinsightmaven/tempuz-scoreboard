import { useEffect, useState, useCallback } from 'react';
import { useLiveDataStore } from '../stores/useLiveDataStore';
import { ProcessedTennisMatch, getRustTennisProcessor } from '../services/rustTennisProcessor';
import { RawTennisData } from '../types/tennisProcessor';

export interface UseTennisWorkerDataOptions {
  componentId?: string;
  debounceMs?: number;
  enableFallback?: boolean;
}

export interface UseTennisWorkerDataResult {
  processedData: ProcessedTennisMatch | null;
  isProcessing: boolean;
  error: string | null;
  processData: (rawData: any) => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Hook for using tennis data processed by Web Worker
 * Provides a clean interface for components to access worker-processed tennis data
 */
export const useTennisWorkerData = (
  options: UseTennisWorkerDataOptions = {}
): UseTennisWorkerDataResult => {
  const {
    componentId,
    debounceMs = 100,
    enableFallback = true
  } = options;

  // Reserved for future debouncing implementation
  console.log('Debounce configured:', debounceMs);

  const {
    lastProcessedData,
    lastError
  } = useLiveDataStore();

  const [processedData, setProcessedData] = useState<ProcessedTennisMatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update local state when store data changes
  useEffect(() => {
    if (lastProcessedData) {
      setProcessedData(lastProcessedData);
      setLastUpdate(new Date());
      setError(null);
    }
  }, [lastProcessedData]);

  // Update error state when store error changes
  useEffect(() => {
    if (lastError) {
      setError(lastError);
    }
  }, [lastError]);

  const processData = useCallback(async (rawData: RawTennisData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const processor = getRustTennisProcessor({
        enableDebugLogging: import.meta.env.DEV
      });

      const result = await processor.processData(rawData);
      setProcessedData(result);
      setLastUpdate(new Date());
      console.log(`✅ Data processed via Rust for ${componentId || 'component'}:`, result.match_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown processing error';
      setError(errorMessage);
      console.error(`❌ Rust processing failed for ${componentId || 'component'}:`, err);

      if (!enableFallback) {
        throw err;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [componentId, enableFallback]);

  return {
    processedData,
    isProcessing,
    error,
    processData,
    lastUpdate
  };
};

/**
 * Hook for getting tennis match data by component ID
 * Automatically handles data retrieval and worker processing
 */
export const useTennisMatchData = (componentId: string) => {
  const { getTennisApiMatch } = useLiveDataStore();
  const workerData = useTennisWorkerData({ componentId });

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const rawData = getTennisApiMatch(componentId);
        if (rawData) {
          await workerData.processData(rawData);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch match data for ${componentId}:`, error);
      }
    };

    if (componentId) {
      fetchMatchData();
    }
  }, [componentId, getTennisApiMatch, workerData]);

  return workerData;
};

/**
 * Hook for batch processing multiple tennis data items
 * Useful for processing multiple matches or large datasets
 */
export const useBatchTennisProcessing = () => {
  const { processTennisDataViaRust } = useLiveDataStore();
  const [batchResults, setBatchResults] = useState<ProcessedTennisMatch[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });

  const processBatch = useCallback(async (rawDataArray: RawTennisData[]): Promise<ProcessedTennisMatch[]> => {
    setIsBatchProcessing(true);
    setBatchProgress({ completed: 0, total: rawDataArray.length });
    setBatchResults([]);

    const results: ProcessedTennisMatch[] = [];

    try {
      for (let i = 0; i < rawDataArray.length; i++) {
        const processedData = await processTennisDataViaRust(rawDataArray[i]);
        results.push(processedData);

        setBatchProgress({ completed: i + 1, total: rawDataArray.length });
        setBatchResults([...results]);
      }

      console.log(`✅ Batch processing completed: ${results.length} items processed`);
      return results;
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    } finally {
      setIsBatchProcessing(false);
    }
  }, [processTennisDataViaRust]);

  return {
    processBatch,
    batchResults,
    isBatchProcessing,
    batchProgress,
    clearBatchResults: () => setBatchResults([])
  };
};
