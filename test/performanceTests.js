// Performance Tests

async function runPerformanceTests(testEnv) {
  const results = [];
  
  try {
    // Test 1: Query Latency
    results.push(await testQueryLatency(testEnv));
    
    // Test 2: Ingestion Throughput
    results.push(await testIngestionThroughput(testEnv));
    
    // Test 3: Concurrent Queries
    results.push(await testConcurrentQueries(testEnv));
    
    // Test 4: Memory Usage
    results.push(await testMemoryUsage(testEnv));
    
    // Test 5: System Health
    results.push(await testSystemHealth(testEnv));
    
  } catch (error) {
    console.error('Error running performance tests:', error);
    results.push({
      name: 'Performance Test Suite',
      success: false,
      error: error
    });
  }
  
  return results;
}

async function testQueryLatency(testEnv) {
  try {
    console.log('  - Testing query latency...');
    
    const queries = [
      "What is the architecture of the enterprise RAG system?",
      "How does the MCP orchestrator work?",
      "What data formats are supported?",
      "How to configure authentication?",
      "What are the deployment options?"
    ];
    
    const latencies = [];
    
    for (const query of queries) {
      const startTime = Date.now();
      
      await testEnv.retrieverEngine.search(
        query,
        { method: 'hybrid' },
        testEnv.testTenant.id
      );
      
      const endTime = Date.now();
      latencies.push(endTime - startTime);
    }
    
    const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    
    return {
      name: 'Query Latency',
      success: averageLatency < 2000, // Success if average < 2 seconds
      details: `Average: ${averageLatency.toFixed(2)}ms, Min: ${minLatency}ms, Max: ${maxLatency}ms`,
      metrics: {
        averageLatencyMs: averageLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        queriesExecuted: queries.length
      }
    };
  } catch (error) {
    console.error('Query latency test failed:', error);
    return {
      name: 'Query Latency',
      success: false,
      error: error
    };
  }
}

async function testIngestionThroughput(testEnv) {
  try {
    console.log('  - Testing ingestion throughput...');
    
    const startTime = Date.now();
    const documentsToProcess = 10;
    
    // Create mock documents
    const mockDocuments = Array.from({ length: documentsToProcess }, (_, i) => ({
      path: `./test/data/doc${i}.pdf`,
      size: 1024 * 1024, // 1MB each
      type: 'application/pdf'
    }));
    
    const config = {
      preprocessing: {
        chunkSize: 1000,
        chunkOverlap: 200,
        extractMetadata: true
      }
    };
    
    // Process documents
    const processedDocs = [];
    for (const doc of mockDocuments) {
      const processed = await testEnv.dataIngestion.processDocument(
        doc,
        config,
        testEnv.testTenant.id
      );
      processedDocs.push(processed);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const throughput = (documentsToProcess / totalTime) * 1000; // docs per second
    
    return {
      name: 'Ingestion Throughput',
      success: throughput > 0.5, // Success if > 0.5 docs/second
      details: `Processed ${documentsToProcess} documents in ${totalTime}ms (${throughput.toFixed(2)} docs/sec)`,
      metrics: {
        documentsProcessed: documentsToProcess,
        totalTimeMs: totalTime,
        throughputDocsPerSecond: throughput
      }
    };
  } catch (error) {
    console.error('Ingestion throughput test failed:', error);
    return {
      name: 'Ingestion Throughput',
      success: false,
      error: error
    };
  }
}

async function testConcurrentQueries(testEnv) {
  try {
    console.log('  - Testing concurrent queries...');
    
    const concurrentQueries = 5;
    const query = "What is the architecture of the enterprise RAG system?";
    
    const startTime = Date.now();
    
    // Execute concurrent queries
    const promises = Array.from({ length: concurrentQueries }, () =>
      testEnv.retrieverEngine.search(
        query,
        { method: 'hybrid' },
        testEnv.testTenant.id
      )
    );
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTimePerQuery = totalTime / concurrentQueries;
    
    return {
      name: 'Concurrent Queries',
      success: averageTimePerQuery < 3000, // Success if average < 3 seconds
      details: `Executed ${concurrentQueries} concurrent queries in ${totalTime}ms (${averageTimePerQuery.toFixed(2)}ms avg)`,
      metrics: {
        concurrentQueries,
        totalTimeMs: totalTime,
        averageTimePerQueryMs: averageTimePerQuery,
        successfulQueries: results.length
      }
    };
  } catch (error) {
    console.error('Concurrent queries test failed:', error);
    return {
      name: 'Concurrent Queries',
      success: false,
      error: error
    };
  }
}

async function testMemoryUsage(testEnv) {
  try {
    console.log('  - Testing memory usage...');
    
    // Get initial memory usage
    const initialMemory = process.memoryUsage();
    
    // Perform memory-intensive operations
    const largeQuery = "What is the architecture of the enterprise RAG system?".repeat(100);
    
    for (let i = 0; i < 10; i++) {
      await testEnv.retrieverEngine.search(
        largeQuery,
        { method: 'hybrid' },
        testEnv.testTenant.id
      );
    }
    
    // Get final memory usage
    const finalMemory = process.memoryUsage();
    
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    return {
      name: 'Memory Usage',
      success: memoryIncreaseMB < 100, // Success if increase < 100MB
      details: `Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`,
      metrics: {
        initialMemoryMB: initialMemory.heapUsed / (1024 * 1024),
        finalMemoryMB: finalMemory.heapUsed / (1024 * 1024),
        memoryIncreaseMB: memoryIncreaseMB
      }
    };
  } catch (error) {
    console.error('Memory usage test failed:', error);
    return {
      name: 'Memory Usage',
      success: false,
      error: error
    };
  }
}

async function testSystemHealth(testEnv) {
  try {
    console.log('  - Testing system health...');
    
    // Check health of all components
    const healthChecks = await Promise.all([
      testEnv.retrieverEngine.healthCheck(),
      testEnv.dataIngestion.healthCheck(),
      testEnv.mcpOrchestrator.healthCheck ? testEnv.mcpOrchestrator.healthCheck() : { status: 'healthy' }
    ]);
    
    const allHealthy = healthChecks.every(check => 
      check.status === 'healthy' || check === 'healthy'
    );
    
    return {
      name: 'System Health',
      success: allHealthy,
      details: allHealthy ? 'All components healthy' : 'Some components unhealthy',
      metrics: {
        componentsChecked: healthChecks.length,
        healthyComponents: healthChecks.filter(check => 
          check.status === 'healthy' || check === 'healthy'
        ).length
      }
    };
  } catch (error) {
    console.error('System health test failed:', error);
    return {
      name: 'System Health',
      success: false,
      error: error
    };
  }
}

export { runPerformanceTests };