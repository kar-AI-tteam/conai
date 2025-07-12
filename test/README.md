# Enterprise RAG System Test Suite

This directory contains comprehensive tests for the Enterprise RAG System.

## Overview

The test suite is designed to validate all aspects of the Enterprise RAG System, including:

- Data ingestion from multiple sources
- Retrieval capabilities (vector, keyword, and hybrid search)
- Multi-tenancy features
- Performance characteristics

## Test Structure

- `testConfig.ts` - Configuration for test environment
- `testSetup.ts` - Test environment initialization
- `testRunner.ts` - Main entry point for running all tests
- `ingestionTests.ts` - Tests for data ingestion pipeline
- `retrievalTests.ts` - Tests for retrieval engine
- `multiTenancyTests.ts` - Tests for multi-tenant capabilities
- `performanceTests.ts` - Tests for system performance
- `testReporting.ts` - Test result reporting utilities

## Running Tests

To run the complete test suite:

```bash
npm run test
```

To run specific test suites:

```bash
# Run only ingestion tests
npm run test:ingestion

# Run only retrieval tests
npm run test:retrieval

# Run only multi-tenancy tests
npm run test:multitenancy

# Run only performance tests
npm run test:performance
```

## Test Data

The test suite uses sample data located in the `test/data` directory:

- `pdfs/` - Sample PDF documents
- `json/` - Sample JSON data
- `images/` - Sample images for OCR testing

## Adding New Tests

To add new tests:

1. Identify the appropriate test file based on the feature being tested
2. Add a new test function following the existing patterns
3. Add the new test to the corresponding test suite runner

## Test Report

After running tests, a comprehensive report is generated showing:

- Overall test pass/fail statistics
- Detailed metrics for performance tests
- List of any failed tests with reasons

## Troubleshooting

If tests are failing:

1. Check that all dependencies are installed
2. Verify environment variables are set correctly
3. Check that test data files exist in the expected locations
4. Look for specific error messages in the test output