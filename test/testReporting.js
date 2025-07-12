// Test Reporting

function generateTestReport(results) {
  // Combine all test results
  const allTests = [
    ...results.ingestion,
    ...results.retrieval,
    ...results.multiTenancy,
    ...results.performance
  ];
  
  // Count test results
  const totalTests = allTests.length;
  const passedTests = allTests.filter(test => test.success).length;
  const failedTests = allTests.filter(test => !test.success).length;
  const skippedTests = 0; // We don't have skipped tests in this implementation
  
  // Collect failures
  const failures = allTests
    .filter(test => !test.success)
    .map(test => ({
      name: test.name,
      reason: test.error ? test.error.message : 'Test failed without specific error'
    }));
  
  // Calculate metrics
  const performanceMetrics = results.performance
    .filter(test => test.metrics)
    .map(test => test.metrics);
  
  const ingestionMetrics = results.ingestion
    .filter(test => test.metrics)
    .map(test => test.metrics);
  
  const averageQueryLatency = performanceMetrics.length > 0
    ? performanceMetrics.reduce((sum, metrics) => sum + (metrics.averageLatencyMs || 0), 0) / performanceMetrics.length
    : 0;
  
  const averageIngestionTime = ingestionMetrics.length > 0
    ? ingestionMetrics.reduce((sum, metrics) => sum + (metrics.processingTimeMs || 0), 0) / ingestionMetrics.length
    : 0;
  
  const memoryUsage = performanceMetrics
    .filter(metrics => metrics.memoryUsageMB)
    .reduce((max, metrics) => Math.max(max, metrics.memoryUsageMB), 0);
  
  // Calculate total duration
  const totalDuration = allTests.reduce((sum, test) => {
    if (test.metrics) {
      if (test.metrics.queryTimeMs) return sum + test.metrics.queryTimeMs;
      if (test.metrics.processingTimeMs) return sum + test.metrics.processingTimeMs;
    }
    return sum;
  }, 0);
  
  // Generate summary
  const summary = `
Enterprise RAG System Test Report
================================

Summary:
  Total Tests: ${totalTests}
  Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)
  Failed: ${failedTests}
  Skipped: ${skippedTests}

Test Suites:
  Ingestion: ${results.ingestion.filter(t => t.success).length}/${results.ingestion.length} passed
  Retrieval: ${results.retrieval.filter(t => t.success).length}/${results.retrieval.length} passed
  Multi-Tenancy: ${results.multiTenancy.filter(t => t.success).length}/${results.multiTenancy.length} passed
  Performance: ${results.performance.filter(t => t.success).length}/${results.performance.length} passed

Performance Metrics:
  Average Query Latency: ${averageQueryLatency.toFixed(2)}ms
  Average Ingestion Time: ${averageIngestionTime.toFixed(2)}ms
  Memory Usage: ${memoryUsage.toFixed(2)}MB
  Total Test Duration: ${(totalDuration / 1000).toFixed(2)}s
`;

  return {
    summary,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    failures,
    metrics: {
      totalDuration,
      averageQueryLatency,
      averageIngestionTime,
      memoryUsage
    }
  };
}

export { generateTestReport };