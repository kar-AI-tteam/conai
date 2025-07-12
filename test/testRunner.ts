// Test Runner for Enterprise RAG System

import { TEST_CONFIG } from './testConfig';
import { setupTestEnvironment } from './testSetup';
import { runIngestionTests } from './ingestionTests';
import { runRetrievalTests } from './retrievalTests';
import { runMultiTenancyTests } from './multiTenancyTests';
import { runPerformanceTests } from './performanceTests';
import { generateTestReport } from './testReporting';

async function runAllTests() {
  console.log('🧪 Starting Enterprise RAG System Tests');
  console.log('=======================================');
  
  try {
    // Initialize test environment
    console.log('\n📋 Setting up test environment...');
    const testEnv = await setupTestEnvironment();
    console.log('✅ Test environment ready');
    
    // Run test suites
    console.log('\n📚 Running Data Ingestion Tests...');
    const ingestionResults = await runIngestionTests(testEnv);
    
    console.log('\n🔍 Running Retrieval Tests...');
    const retrievalResults = await runRetrievalTests(testEnv);
    
    console.log('\n🏢 Running Multi-Tenancy Tests...');
    const multiTenancyResults = await runMultiTenancyTests(testEnv);
    
    console.log('\n⚡ Running Performance Tests...');
    const performanceResults = await runPerformanceTests(testEnv);
    
    // Generate and display test report
    console.log('\n📊 Generating Test Report...');
    const report = generateTestReport({
      ingestion: ingestionResults,
      retrieval: retrievalResults,
      multiTenancy: multiTenancyResults,
      performance: performanceResults
    });
    
    console.log('\n📝 Test Report:');
    console.log(report.summary);
    
    if (report.failures.length > 0) {
      console.log('\n❌ Failed Tests:');
      report.failures.forEach(failure => {
        console.log(`- ${failure.name}: ${failure.reason}`);
      });
    }
    
    console.log('\n🏁 All tests completed');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests when executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };