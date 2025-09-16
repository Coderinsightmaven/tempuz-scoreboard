// Performance testing utilities for Web Worker implementation
export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isRecording = false;

  startRecording() {
    this.isRecording = true;
    this.metrics = [];
    console.log('🎯 Performance recording started');
  }

  stopRecording() {
    this.isRecording = false;
    console.log('⏹️ Performance recording stopped');
    return this.getMetrics();
  }

  recordMetric(operation: string, startTime: number, endTime: number) {
    if (!this.isRecording) return;

    const duration = endTime - startTime;
    const metric: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration
    };

    // Try to get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metric.memoryUsage = memory.usedJSHeapSize;
    }

    this.metrics.push(metric);
    console.log(`📊 ${operation}: ${duration.toFixed(2)}ms`);
  }

  async measureAsync<T>(
    operation: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await asyncFn();
      const endTime = performance.now();
      this.recordMetric(operation, startTime, endTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`${operation} (failed)`, startTime, endTime);
      throw error;
    }
  }

  measureSync<T>(
    operation: string,
    syncFn: () => T
  ): T {
    const startTime = performance.now();
    try {
      const result = syncFn();
      const endTime = performance.now();
      this.recordMetric(operation, startTime, endTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`${operation} (failed)`, startTime, endTime);
      throw error;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  getSummary() {
    const summary: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.operation]) {
        summary[metric.operation] = {
          count: 0,
          avgDuration: 0,
          totalDuration: 0
        };
      }

      summary[metric.operation].count++;
      summary[metric.operation].totalDuration += metric.duration;
    });

    // Calculate averages
    Object.keys(summary).forEach(operation => {
      summary[operation].avgDuration = summary[operation].totalDuration / summary[operation].count;
    });

    return summary;
  }

  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Test tennis data processing performance with and without Web Worker
 */
export async function testTennisDataProcessingPerformance() {
  console.log('🏓 Testing tennis data processing performance...');

  // Create mock tennis data
  const mockData = {
    matchId: 'test-match-001',
    player1: { name: 'Test Player 1', country: 'US' },
    player2: { name: 'Test Player 2', country: 'GB' },
    score: {
      player1_sets: 2,
      player2_sets: 1,
      player1_games: 5,
      player2_games: 3,
      player1_points: '40',
      player2_points: '30'
    },
    sets: {
      '1': { player1: 6, player2: 4 },
      '2': { player1: 4, player2: 6 },
      '3': { player1: 5, player2: 3 }
    },
    serving_player: 1,
    current_set: 3,
    is_tiebreak: false,
    match_status: 'in_progress'
  };

  performanceMonitor.startRecording();

  // Test 1: Main thread processing (baseline)
  console.log('📊 Testing main thread processing...');
  performanceMonitor.measureSync('main-thread-processing', () => {
    // Simulate the processing logic
    const processed = {
      matchId: mockData.matchId,
      player1: mockData.player1,
      player2: mockData.player2,
      score: {
        player1Sets: mockData.score.player1_sets,
        player2Sets: mockData.score.player2_sets,
        player1Games: mockData.score.player1_games,
        player2Games: mockData.score.player2_games,
        player1Points: mockData.score.player1_points,
        player2Points: mockData.score.player2_points
      },
      sets: mockData.sets,
      servingPlayer: mockData.serving_player,
      currentSet: mockData.current_set,
      isTiebreak: mockData.is_tiebreak,
      matchStatus: mockData.match_status
    };
    return processed;
  });

  // Test 2: With worker (if available)
  console.log('📊 Testing worker processing...');
  try {
    const { useLiveDataStore } = await import('../stores/useLiveDataStore');
    const store = useLiveDataStore.getState();

    const rustResult = await performanceMonitor.measureAsync('rust-processing', async () => {
      return await store.processTennisDataViaRust(mockData as any);
    });

    console.log('✅ Rust processing result:', rustResult.match_id);
  } catch (error) {
    console.error('❌ Worker test failed:', error);
  }

  const metrics = performanceMonitor.stopRecording();
  const summary = performanceMonitor.getSummary();

  console.log('📈 Performance Test Results:');
  console.table(summary);

  return {
    metrics,
    summary,
    mainThreadDuration: summary['main-thread-processing']?.avgDuration || 0,
    workerDuration: summary['worker-processing']?.avgDuration || 0
  };
}

/**
 * Test component rendering performance
 */
export async function testComponentRenderingPerformance(componentCount = 50) {
  console.log(`🎨 Testing component rendering performance (${componentCount} components)...`);

  performanceMonitor.startRecording();

  // Simulate component rendering workload
  const renderStart = performance.now();

  // Create mock components
  const mockComponents = Array.from({ length: componentCount }, (_, i) => ({
    id: `component-${i}`,
    type: 'TENNIS_PLAYER_NAME' as const,
    position: { x: i * 100, y: i * 50 },
    size: { width: 200, height: 50 },
    style: { fontSize: 16, color: '#000' },
    data: { text: `Player ${i}`, playerNumber: i % 2 + 1 }
  }));

  // Simulate rendering logic
  performanceMonitor.measureSync('component-rendering', () => {
    mockComponents.forEach(component => {
      // Simulate DOM manipulation
      const element = {
        style: {
          left: `${component.position.x}px`,
          top: `${component.position.y}px`,
          width: `${component.size.width}px`,
          height: `${component.size.height}px`,
          fontSize: `${component.style.fontSize}px`,
          color: component.style.color
        },
        textContent: component.data.text
      };
      // Simulate expensive operations
      JSON.stringify(element);
    });
  });

  const renderEnd = performance.now();
  const renderDuration = renderEnd - renderStart;

  console.log(`✅ Component rendering completed in ${renderDuration.toFixed(2)}ms`);

  const metrics = performanceMonitor.stopRecording();
  return {
    metrics,
    totalDuration: renderDuration,
    averagePerComponent: renderDuration / componentCount
  };
}

/**
 * Run comprehensive performance test suite
 */
export async function runPerformanceTestSuite() {
  console.log('🚀 Running comprehensive performance test suite...');

  const results = {
    tennisProcessing: await testTennisDataProcessingPerformance(),
    componentRendering: await testComponentRenderingPerformance(100)
  };

  console.log('📊 Test Suite Results:');
  console.log('Tennis Processing:', results.tennisProcessing.summary);
  console.log('Component Rendering:', {
    totalDuration: results.componentRendering.totalDuration,
    averagePerComponent: results.componentRendering.averagePerComponent
  });

  // Calculate performance improvements
  const mainThreadDuration = results.tennisProcessing.mainThreadDuration;
  const rustDuration = results.tennisProcessing.summary['rust-processing']?.avgDuration || 0;

  if (rustDuration > 0 && mainThreadDuration > 0) {
    const improvement = ((mainThreadDuration - rustDuration) / mainThreadDuration * 100).toFixed(2);
    console.log(`🎉 Performance improvement: ${improvement}% faster with Rust backend`);
  }

  return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  (window as any).runPerformanceTestSuite = runPerformanceTestSuite;
  (window as any).testTennisDataProcessingPerformance = testTennisDataProcessingPerformance;
  (window as any).testComponentRenderingPerformance = testComponentRenderingPerformance;
}
