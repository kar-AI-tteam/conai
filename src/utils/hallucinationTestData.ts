import { QAItem } from '../types/qa';

/**
 * Sample entries for testing hallucination detection
 */
export const hallucinationTestEntries: QAItem[] = [
  {
    id: 'test-payment-api-processing',
    question: 'How does the payment API process transactions?',
    answer: 'The payment API processes transactions by validating payment details, checking account balances, and securely transferring funds between accounts. It uses industry-standard encryption and follows PCI DSS compliance requirements.',
    keywords: ['payment', 'api', 'transactions', 'processing', 'validation', 'encryption', 'pci', 'compliance'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-api-auth',
    question: 'How does the payment API authenticate users?',
    answer: 'The payment API uses Bearer token authentication. Users must include a valid JWT token in the Authorization header for all requests.',
    keywords: ['payment', 'api', 'authentication', 'bearer', 'jwt', 'token'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-api-rate-limits',
    question: 'What are the rate limits for the user API?',
    answer: 'The user API has a rate limit of 1000 requests per hour per API key. Exceeding this limit will result in a 429 Too Many Requests response.',
    keywords: ['user', 'api', 'rate', 'limit', '1000', 'requests', 'hour'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-database-config',
    question: 'How is the database configured?',
    answer: 'The application uses PostgreSQL 14 as the primary database. Connection pooling is handled by pgBouncer with a maximum of 100 connections.',
    keywords: ['database', 'postgresql', 'pgbouncer', 'connections', 'configuration'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-deployment-process',
    question: 'What is the deployment process?',
    answer: 'Deployments are automated through GitHub Actions. Code is deployed to staging first, then to production after manual approval.',
    keywords: ['deployment', 'github', 'actions', 'staging', 'production', 'approval'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-security-measures',
    question: 'What security measures are in place?',
    answer: 'The application implements HTTPS encryption, input validation, SQL injection prevention, and regular security audits.',
    keywords: ['security', 'https', 'encryption', 'validation', 'sql', 'injection', 'audits'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/**
 * Test scenarios for hallucination detection
 */
export const hallucinationTestScenarios = [
  {
    name: 'Payment API Processing Test',
    userQuery: 'How does the payment API process transactions?',
    expectedHallucination: false,
    description: 'Should return accurate information about payment processing from knowledge base',
    testPrompt: 'Ask about payment API processing - should get accurate info without hallucination'
  },
  {
    name: 'Context Deviation Test',
    userQuery: 'How does the payment API work with blockchain?',
    expectedHallucination: true,
    description: 'AI should stick to known payment processing info, not invent blockchain details',
    testPrompt: 'Ask about payment API blockchain integration - should trigger hallucination detection'
  },
  {
    name: 'Factual Consistency Test',
    userQuery: 'What are the exact rate limits?',
    expectedHallucination: false,
    description: 'AI should accurately report the 1000 requests per hour limit',
    testPrompt: 'Ask about rate limits - should get accurate info from knowledge base'
  },
  {
    name: 'Speculation Test',
    userQuery: 'How does the system handle high traffic?',
    expectedHallucination: true,
    description: 'AI might speculate about load balancing or scaling not mentioned in knowledge base',
    testPrompt: 'Ask about traffic handling - AI might hallucinate scaling solutions'
  },
  {
    name: 'Confidence Test',
    userQuery: 'What database optimizations are used?',
    expectedHallucination: true,
    description: 'AI might invent optimization techniques not mentioned in basic config info',
    testPrompt: 'Ask about database optimizations - should trigger low confidence warnings'
  },
  {
    name: 'Source Attribution Test',
    userQuery: 'Are there any performance benchmarks?',
    expectedHallucination: true,
    description: 'AI might make claims about performance without sources',
    testPrompt: 'Ask about performance - AI might make unsupported claims'
  }
];

/**
 * Expected hallucination patterns for testing
 */
export const expectedHallucinationPatterns = {
  uncertainLanguage: [
    'I think the payment API probably processes transactions',
    'The system might use load balancing',
    'It seems like the database could be optimized'
  ],
  contextDeviation: [
    'The payment API processes credit cards using advanced ML algorithms',
    'The system uses quantum computing for faster processing',
    'The database includes blockchain technology for security'
  ],
  unsupportedClaims: [
    'Studies show this is the fastest API in the industry',
    'Research indicates 99.99% uptime',
    'Experts recommend this configuration'
  ],
  contradictoryStatements: [
    'The API is always available. However, it cannot be accessed during maintenance.',
    'The system is completely secure. But users should be careful with sensitive data.',
    'The database never goes down. Sometimes it requires restarts for updates.'
  ]
};

/**
 * Helper function to load test data into storage
 */
export const loadTestData = async () => {
  const { storageManager } = await import('./storage/storageManager');
  const provider = storageManager.getCurrentProvider();
  
  console.log('🧪 Loading hallucination test data...');
  
  for (const entry of hallucinationTestEntries) {
    try {
      await provider.addEntry(entry);
      console.log(`✅ Added test entry: ${entry.question}`);
    } catch (error) {
      console.log(`⚠️ Entry might already exist: ${entry.question}`);
    }
  }
  
  console.log('✅ Test data loaded successfully!');
  console.log('\n🎯 TEST THE PAYMENT API QUESTION:');
  console.log('1. Switch to "Knowledge Base + AI" mode');
  console.log('2. Ask: "How does the payment API process transactions?"');
  console.log('3. You should get accurate information without hallucination warnings');
  console.log('4. Then try: "How does the payment API work with blockchain?"');
  console.log('5. This should trigger hallucination detection\n');
  
  return hallucinationTestEntries;
};

/**
 * Helper function to add just the payment API entry
 */
export const addPaymentAPIEntry = async () => {
  const { storageManager } = await import('./storage/storageManager');
  const provider = storageManager.getCurrentProvider();
  
  const paymentEntry: QAItem = {
    id: 'payment-api-processing',
    question: 'How does the payment API process transactions?',
    answer: 'The payment API processes transactions by validating payment details, checking account balances, and securely transferring funds between accounts. It uses industry-standard encryption and follows PCI DSS compliance requirements.',
    keywords: ['payment', 'api', 'transactions', 'processing', 'validation', 'encryption', 'pci', 'compliance'],
    entryType: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    await provider.addEntry(paymentEntry);
    console.log('✅ Payment API entry added successfully!');
    console.log('\n🎯 NOW TEST THE QUESTION:');
    console.log('1. Switch to "Knowledge Base + AI" mode');
    console.log('2. Ask: "How does the payment API process transactions?"');
    console.log('3. You should now get a proper answer from the knowledge base');
    console.log('4. Watch for hallucination detection results in the console\n');
    return true;
  } catch (error) {
    console.error('❌ Error adding payment API entry:', error);
    return false;
  }
};

/**
 * Helper function to run hallucination tests
 */
export const runHallucinationTests = () => {
  console.log('\n🧪 HALLUCINATION DETECTION TEST SCENARIOS');
  console.log('==========================================\n');
  
  hallucinationTestScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Query: "${scenario.userQuery}"`);
    console.log(`   Expected Hallucination: ${scenario.expectedHallucination ? '❌ Yes' : '✅ No'}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Test: ${scenario.testPrompt}\n`);
  });
  
  console.log('💡 HOW TO TEST:');
  console.log('1. Switch to "Knowledge Base + AI" mode');
  console.log('2. Try each test query above');
  console.log('3. Look for hallucination warnings and confidence indicators');
  console.log('4. Check browser console for detection logs');
  console.log('5. Compare results with expected outcomes\n');
  
  console.log('🔍 WHAT TO LOOK FOR:');
  console.log('• ⚠️ Accuracy notices for potentially inaccurate responses');
  console.log('• 🎯 Confidence percentages (Low/Medium/High)');
  console.log('• 📊 Detection details when clicking "Show detection details"');
  console.log('• 🔗 Source attribution and verification suggestions');
  console.log('• 🚨 Console logs showing detection results');
};