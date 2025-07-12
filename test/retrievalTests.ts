// Retrieval Tests

import { TestEnvironment } from './testSetup';
import { TEST_CONFIG } from './testConfig';
import { QueryResult } from '../src/types/enterprise';

interface RetrievalTestResult {
  name: string;
  success: boolean;
  details?: string;
  error?: Error;
  metrics?: {
    queryTimeMs: number;
    resultsCount: number;
    averageScore: number;
  };
}

export async function runRetrievalTests(testEnv: TestEnvironment): Promise<RetrievalTestResult[]> {
  const results: RetrievalTestResult[] = [];
  
  try {
    // Test 1: Basic Vector Search
    results.push(await testVectorSearch(testEnv));
    
    // Test 2: Keyword Search
    results.push(await testKeywordSearch(testEnv));
    
    // Test 3: Hybrid Search
    results.push(await testHybridSearch(testEnv));
    
    // Test 4: Filtered Search
    results.push(await testFilteredSearch(testEnv));
    
    // Test 5: Re-ranking
    results.push(await testReranking(testEnv));
    
  } catch (error) {
    console.error('Error running retrieval tests:', error);
    results.push({
      name: 'Retrieval Test Suite',
      success: false,
      error: error as Error
    });
  }
  
  return results;
}

async function testVectorSearch(testEnv: TestEnvironment): Promise<RetrievalTestResult> {
  try {
    console.log('  - Testing vector search...');
    const startTime = Date.now();
    
    // Run vector search
    const query = TEST_CONFIG.testQueries[0].text;
    const results = await testEnv.retrieverEngine.search(
      query,
      { method: 'vector' },
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Vector Search',
      success: results.length > 0,
      details: `Found ${results.length} results using vector search`,
      metrics: {
        queryTimeMs: endTime - startTime,
        resultsCount: results.length,
        averageScore: calculateAverageScore(results)
      }
    };
  } catch (error) {
    console.error('Vector search test failed:', error);
    return {
      name: 'Vector Search',
      success: false,
      error: error as Error
    };
  }
}

async function testKeywordSearch(testEnv: TestEnvironment): Promise<RetrievalTestResult> {
  try {
    console.log('  - Testing keyword search...');
    const startTime = Date.now();
    
    // Run keyword search
    const query = TEST_CONFIG.testQueries[1].text;
    const results = await testEnv.retrieverEngine.search(
      query,
      { method: 'keyword' },
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Keyword Search',
      success: results.length > 0,
      details: `Found ${results.length} results using keyword search`,
      metrics: {
        queryTimeMs: endTime - startTime,
        resultsCount: results.length,
        averageScore: calculateAverageScore(results)
      }
    };
  } catch (error) {
    console.error('Keyword search test failed:', error);
    return {
      name: 'Keyword Search',
      success: false,
      error: error as Error
    };
  }
}

async function testHybridSearch(testEnv: TestEnvironment): Promise<RetrievalTestResult> {
  try {
    console.log('  - Testing hybrid search...');
    const startTime = Date.now();
    
    // Run hybrid search
    const query = TEST_CONFIG.testQueries[2].text;
    const results = await testEnv.retrieverEngine.search(
      query,
      { method: 'hybrid' },
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Hybrid Search',
      success: results.length > 0,
      details: `Found ${results.length} results using hybrid search`,
      metrics: {
        queryTimeMs: endTime - startTime,
        resultsCount: results.length,
        averageScore: calculateAverageScore(results)
      }
    };
  } catch (error) {
    console.error('Hybrid search test failed:', error);
    return {
      name: 'Hybrid Search',
      success: false,
      error: error as Error
    };
  }
}

async function testFilteredSearch(testEnv: TestEnvironment): Promise<RetrievalTestResult> {
  try {
    console.log('  - Testing filtered search...');
    const startTime = Date.now();
    
    // Run filtered search
    const query = TEST_CONFIG.testQueries[0].text;
    const filters = {
      fileType: 'pdf',
      createdAfter: '2023-01-01'
    };
    
    const results = await testEnv.retrieverEngine.search(
      query,
      { 
        method: 'hybrid',
        filters
      },
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Filtered Search',
      success: results.length > 0,
      details: `Found ${results.length} results using filtered search`,
      metrics: {
        queryTimeMs: endTime - startTime,
        resultsCount: results.length,
        averageScore: calculateAverageScore(results)
      }
    };
  } catch (error) {
    console.error('Filtered search test failed:', error);
    return {
      name: 'Filtered Search',
      success: false,
      error: error as Error
    };
  }
}

async function testReranking(testEnv: TestEnvironment): Promise<RetrievalTestResult> {
  try {
    console.log('  - Testing re-ranking...');
    const startTime = Date.now();
    
    // Run search with re-ranking
    const query = TEST_CONFIG.testQueries[0].text;
    const results = await testEnv.retrieverEngine.search(
      query,
      { 
        method: 'hybrid',
        rerank: true
      },
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Re-ranking',
      success: results.length > 0,
      details: `Found ${results.length} results with re-ranking`,
      metrics: {
        queryTimeMs: endTime - startTime,
        resultsCount: results.length,
        averageScore: calculateAverageScore(results)
      }
    };
  } catch (error) {
    console.error('Re-ranking test failed:', error);
    return {
      name: 'Re-ranking',
      success: false,
      error: error as Error
    };
  }
}

function calculateAverageScore(results: QueryResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((total, result) => total + result.score, 0);
  return sum / results.length;
}