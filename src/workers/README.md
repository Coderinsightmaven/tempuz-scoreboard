# Web Workers Implementation

This directory contains the Web Worker implementation for processing tennis data to improve application performance by offloading heavy computations from the main thread.

## Overview

The Web Worker system consists of:

- **`tennisDataWorker.ts`** - The actual Web Worker that processes tennis data
- **`TennisWorkerManager.ts`** - Manager class for communicating with the worker
- **`useTennisWorkerData.ts`** - React hook for easy integration with components

## Architecture

```
Main Thread                    Worker Thread
├── React Components          ├── TennisDataProcessor
├── useLiveDataStore          ├── Data Validation
├── TennisWorkerManager       ├── Data Transformation
└── Message Passing           └── Response Handling
```

## Benefits

- **Improved Performance**: Heavy tennis data processing moved off main thread
- **Better Responsiveness**: UI remains smooth during data processing
- **Scalability**: Can handle multiple simultaneous data processing requests
- **Error Isolation**: Worker errors don't crash the main application
- **Memory Management**: Better memory usage patterns

## Usage

### Basic Usage

```typescript
import { useTennisWorkerData } from '../hooks/useTennisWorkerData';

function MyComponent() {
  const { processedData, isProcessing, processData } = useTennisWorkerData({
    componentId: 'my-component',
    debounceMs: 50
  });

  const handleData = async (rawData) => {
    await processData(rawData);
  };

  return (
    <div>
      {isProcessing ? 'Processing...' : 'Ready'}
      {processedData && <div>{processedData.matchId}</div>}
    </div>
  );
}
```

### Advanced Usage

```typescript
import { useBatchTennisProcessing } from '../hooks/useTennisWorkerData';

function BatchProcessor() {
  const { processBatch, batchResults, isBatchProcessing, batchProgress } = useBatchTennisProcessing();

  const handleBatchProcess = async () => {
    const rawDataArray = [/* array of tennis match data */];
    const results = await processBatch(rawDataArray);
    console.log('Processed', results.length, 'matches');
  };

  return (
    <div>
      <button onClick={handleBatchProcess} disabled={isBatchProcessing}>
        {isBatchProcessing ? `Processing... ${batchProgress.completed}/${batchProgress.total}` : 'Process Batch'}
      </button>
      <div>Results: {batchResults.length}</div>
    </div>
  );
}
```

### Direct Worker Manager Usage

```typescript
import { getTennisWorkerManager } from '../workers/TennisWorkerManager';

async function processData() {
  const workerManager = getTennisWorkerManager();

  // Ensure worker is initialized
  await workerManager.initialize();

  // Process data
  const result = await workerManager.processTennisData(rawData);
  console.log('Processed:', result);
}
```

## Configuration

The worker can be configured with various options:

```typescript
const config = {
  debounceMs: 50,           // Debounce time for rapid updates
  enableDebugLogging: false, // Enable debug logging
  maxRetries: 3,            // Maximum retry attempts
  retryDelay: 1000          // Delay between retries
};

// Initialize with config
await initializeTennisWorker(config);
```

## Data Processing

The worker processes tennis data from various formats into a standardized structure:

### Input Formats Supported
- IonCourt API format
- Generic tennis data format
- Custom match data structures

### Output Format
```typescript
interface ProcessedTennisMatch {
  matchId: string;
  player1: { name: string; country?: string; seed?: number };
  player2: { name: string; country?: string; seed?: number };
  score: {
    player1Sets: number;
    player2Sets: number;
    player1Games: number;
    player2Games: number;
    player1Points: string;
    player2Points: string;
  };
  sets: Record<string, { player1: number; player2: number }>;
  servingPlayer: number;
  currentSet: number;
  isTiebreak: boolean;
  matchStatus: 'in_progress' | 'completed';
}
```

## Error Handling

The worker includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Data Validation**: Invalid data is rejected with detailed error messages
- **Worker Errors**: Isolated from main thread, graceful fallback
- **Timeout Handling**: Requests timeout after 5 seconds by default

## Performance Testing

Run performance tests to measure improvements:

```typescript
import { runPerformanceTestSuite } from '../utils/performanceTest';

// Run comprehensive test suite
const results = await runPerformanceTestSuite();
console.log('Performance results:', results);
```

Or test specific components:

```typescript
import {
  testTennisDataProcessingPerformance,
  testComponentRenderingPerformance
} from '../utils/performanceTest';

// Test tennis data processing
await testTennisDataProcessingPerformance();

// Test component rendering
await testComponentRenderingPerformance(100);
```

## Browser Support

The Web Worker implementation supports:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge 12+

## Troubleshooting

### Worker Not Initializing
```typescript
// Check if worker is initialized
const { workerInitialized } = useLiveDataStore();
console.log('Worker initialized:', workerInitialized);
```

### Processing Errors
```typescript
// Enable debug logging
await updateWorkerConfig({ enableDebugLogging: true });
```

### Performance Issues
```typescript
// Adjust debounce timing
await updateWorkerConfig({ debounceMs: 25 });
```

## Integration with Existing Code

The Web Worker system is designed to be a drop-in enhancement:

1. **Automatic Fallback**: If worker fails, system falls back to main thread processing
2. **Backward Compatible**: Existing code continues to work without changes
3. **Progressive Enhancement**: Performance improves as worker becomes available

## Future Enhancements

- **Shared Workers**: Multiple tabs can share the same worker instance
- **Service Workers**: Background processing even when app is closed
- **WebAssembly**: High-performance data processing modules
- **Compression**: Reduce data transfer between main thread and worker
