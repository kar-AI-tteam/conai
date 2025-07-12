// Performance Tests

import { TestEnvironment } from './testSetup';
import { TEST_CONFIG } from './testConfig';

interface PerformanceTestResult {
  name: string;
  success: boolean;
  details?: string;
  error?: Error;
  metrics?: {
    averageLatencyMs: number;
    p95LatencyMs: number;
    throughputQps: number;
    memoryUsageMB: number;
  };
}

export async function runPerformanceTests(testEnv: TestEnvironment): Promise<PerformanceTestResult[]> {
  const results: PerformanceTestResult[] = [];
  
  try {
    // Test 1: Query Latency
    results.push(await testQueryLatency(testEnv));
    
    // Test 2: Ingestion Throughput
    results.push(await testIngestionThroughput(testEnv));
    
    // Test 3: Concurrent Queries
    results.push(await testConcurrentQueries(testEnv));
    
    // Test 4: Memory Usage
    results.push(await testMemoryUsage(testEnv));
    
  } catch (error) {
    console.error('Error running performance tests:', error);
    results.push({
      name: 'Performance Test Suite',
      success: false,
      error: error as Error
    });
  }
  
  return results;
}

async function testQueryLatency(testEnv: TestEnvironment): Promise<PerformanceTestResult> {
  try {
    console.log('  - Testing query latency...');
    
    const iterations = 10;
    const latencies: number[] = [];
    
    // Run multiple queries and measure latency
    for (let i = 0; i < iterations; i++) {
      const query = TEST_CONFIG.testQueries[i % TEST_CONFIG.testQueries.length].text;
      
      const startTime = Date.now();
      await testEnv.retrieverEngine.search(
        query,
        {},
        testEnv.testTenant.id
      );
      const endTime = Date.now();
      
      latencies.push(endTime - startTime);
    }
    
    // Calculate metrics
    const averageLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];
    
    const success = averageLatency < 1000; // Less than 1 second
    
    return {
      name: 'Query Latency',
      success,
      details: `Average query latency: ${averageLatency.toFixed(2)}ms, P95: ${p95Latency}ms`,
      metrics: {
        averageLatencyMs: averageLatency,
        p95LatencyMs: p95Latency,
        throughputQps: 1000 / averageLatency,
        memoryUsageMB: 0 // Not measured in this test
      }
    };
  } catch (error) {
    console.error('Query latency test failed:', error);
    return {
      name: 'Query Latency',
      success: false,
      error: error as Error
    };
  }
}

async function testIngestionThroughput(testEnv: TestEnvironment): Promise<PerformanceTestResult> {
  try {
    console.log('  - Testing ingestion throughput...');
    
    const documentCount = 5;
    const startTime = Date.now();
    
    // Create data source
    const dataSource = {
      id: 'perf-test-source',
      tenantId: testEnv.testTenant.id,
      name: 'Performance Test Source',
      type: 'json',
      config: {
        preprocessing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          extractMetadata: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Generate test documents
    const documents = [];
    for (let i = 0; i < documentCount; i++) {
      const mockData = JSON.stringify({
        title: `Test Document ${i}`,
        content: `This is test document ${i} for performance testing. It contains some sample text that will be processed by the ingestion pipeline.`
      });
      
      documents.push(mockData);
    }
    
    // Process documents
    await testEnv.dataIngestion.batchProcess(
      documents,
      dataSource.config,
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const throughput = (documentCount / totalTimeMs) * 1000; // docs per second
    
    return {
      name: 'Ingestion Throughput',
      success: true,
      details: `Processed ${documentCount} documents in ${totalTimeMs}ms (${throughput.toFixed(2)} docs/sec)`,
      metrics: {
        averageLatencyMs: totalTimeMs / documentCount,
        p95LatencyMs: 0, // Not measured in this test
        throughputQps: throughput,
        memoryUsageMB: 0 // Not measured in this test
      }
    };
  } catch (error) {
    console.error('Ingestion throughput test failed:', error);
    return {
      name: 'Ingestion Throughput',
      success: false,
      error: error as Error
    };
  }
}

async function testConcurrentQueries(testEnv: TestEnvironment): Promise<PerformanceTestResult> {
  try {
    console.log('  - Testing concurrent queries...');
    
    const concurrentQueries = 5;
    const queries = TEST_CONFIG.testQueries.map(q => q.text);
    
    const startTime = Date.now();
    
    // Run queries concurrently
    const queryPromises = [];
    for (let i = 0; i < concurrentQueries; i++) {
      const query = queries[i % queries.length];
      queryPromises.push(
        testEnv.retrieverEngine.search(
          query,
          {},
          testEnv.testTenant.id
        )
      );
    }
    
    await Promise.all(queryPromises);
    
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const throughput = (concurrentQueries / totalTimeMs) * 1000; // queries per second
    
    return {
      name: 'Concurrent Queries',
      success: true,
      details: `Processed ${concurrentQueries} concurrent queries in ${totalTimeMs}ms (${throughput.toFixed(2)} qps)`,
      metrics: {
        averageLatencyMs: totalTimeMs,
        p95LatencyMs: 0, // Not measured in this test
        throughputQps: throughput,
        memoryUsageMB: 0 // Not measured in this test
      }
    };
  } catch (error) {
    console.error('Concurrent queries test failed:', error);
    return {
      name: 'Concurrent Queries',
      success: false,
      error: error as Error
    };
  }
}

async function testMemoryUsage(testEnv: TestEnvironment): Promise<PerformanceTestResult> {
  try {
    console.log('  - Testing memory usage...');
    
    // Get initial memory usage
    const initialMemory = process.memoryUsage();
    
    // Run a series of operations
    const query = TEST_CONFIG.testQueries[0].text;
    for (let i = 0; i < 10; i++) {
      await testEnv.retrieverEngine.search(
        query,
        {},
        testEnv.testTenant.id
      );
    }
    
    // Get final memory usage
    const finalMemory = process.memoryUsage();
    
    // Calculate memory increase
    const heapIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
    const rssIncreaseMB = (finalMemory.rss - initialMemory.rss) / (1024 * 1024);
    
    const success = heapIncreaseMB < 100; // Less than 100MB increase
    
    return {
      name: 'Memory Usage',
      success,
      details: `Heap memory increase: ${heapIncreaseMB.toFixed(2)}MB, RSS increase: ${rssIncreaseMB.toFixed(2)}MB`,
      metrics: {
        averageLatencyMs: 0, // Not measured in this test
        p95LatencyMs: 0, // Not measured in this test
        throughputQps: 0, // Not measured in this test
        memoryUsageMB: heapIncreaseMB
      }
    };
  } catch (error) {
    console.error('Memory usage test failed:', error);
    return {
      name: 'Memory Usage',
      success: false,
      error: error as Error
    };
  }
}