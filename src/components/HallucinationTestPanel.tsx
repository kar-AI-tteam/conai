import React, { useState } from 'react';
import { TestTube, Play, CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Plus } from 'lucide-react';
import { hallucinationTestScenarios, loadTestData, runHallucinationTests, expectedHallucinationPatterns, addPaymentAPIEntry } from '../utils/hallucinationTestData';
import { HallucinationDetector } from '../utils/hallucinationDetector';

interface HallucinationTestPanelProps {
  onTestQuery: (query: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export const HallucinationTestPanel: React.FC<HallucinationTestPanelProps> = ({
  onTestQuery,
  isVisible,
  onToggle
}) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    scenario: string;
    query: string;
    result: any;
    timestamp: string;
  }>>([]);

  const handleLoadTestData = async () => {
    setIsLoadingData(true);
    try {
      await loadTestData();
      runHallucinationTests();
      alert('✅ Test data loaded! Check console for test scenarios.');
    } catch (error) {
      console.error('Error loading test data:', error);
      alert('❌ Error loading test data. Check console for details.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddPaymentEntry = async () => {
    setIsAddingEntry(true);
    try {
      const success = await addPaymentAPIEntry();
      if (success) {
        alert('✅ Payment API entry added! Now try asking: "How does the payment API process transactions?"');
      } else {
        alert('❌ Failed to add entry. Check console for details.');
      }
    } catch (error) {
      console.error('Error adding payment entry:', error);
      alert('❌ Error adding payment entry. Check console for details.');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleRunPatternTest = (pattern: string) => {
    // Test the pattern directly with the detector
    const result = HallucinationDetector.detectHallucination(
      pattern,
      [], // No context to force hallucination detection
      'Test query',
      0.5 // Medium confidence
    );

    console.log('🧪 Pattern Test Result:', {
      pattern,
      result
    });

    setTestResults(prev => [...prev, {
      scenario: 'Pattern Test',
      query: pattern,
      result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors z-50"
        title="Open Hallucination Test Panel"
      >
        <TestTube size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
        <div className="flex items-center gap-2">
          <TestTube className="text-purple-600 dark:text-purple-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Hallucination Testing
          </h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[60vh]">
        {/* Quick Add Payment Entry */}
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Quick Fix for Your Question
          </h4>
          <p className="text-xs text-green-700 dark:text-green-300 mb-2">
            Add the payment API entry to test: "How does the payment API process transactions?"
          </p>
          <button
            onClick={handleAddPaymentEntry}
            disabled={isAddingEntry}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {isAddingEntry ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {isAddingEntry ? 'Adding...' : 'Add Payment API Entry'}
          </button>
        </div>

        {/* Load Test Data */}
        <div className="mb-4">
          <button
            onClick={handleLoadTestData}
            disabled={isLoadingData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingData ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            {isLoadingData ? 'Loading...' : 'Load All Test Data'}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Loads all sample entries for comprehensive testing
          </p>
        </div>

        {/* Test Scenarios */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Test Scenarios
          </h4>
          <div className="space-y-2">
            {hallucinationTestScenarios.map((scenario, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {scenario.expectedHallucination ? (
                        <XCircle size={14} className="text-red-500" />
                      ) : (
                        <CheckCircle2 size={14} className="text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {scenario.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {scenario.description}
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      "{scenario.userQuery}"
                    </code>
                  </div>
                  <button
                    onClick={() => onTestQuery(scenario.userQuery)}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Run this test"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Tests */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Pattern Tests
          </h4>
          <div className="space-y-2">
            {Object.entries(expectedHallucinationPatterns).map(([category, patterns]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h5>
                {patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                      "{pattern.substring(0, 40)}..."
                    </span>
                    <button
                      onClick={() => handleRunPatternTest(pattern)}
                      className="ml-2 p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                      title="Test this pattern"
                    >
                      <TestTube size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Recent Test Results
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {testResults.slice(-5).map((result, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    {result.result.isHallucination ? (
                      <AlertTriangle size={12} className="text-red-500" />
                    ) : (
                      <CheckCircle2 size={12} className="text-green-500" />
                    )}
                    <span className="font-medium">
                      {result.result.isHallucination ? 'Hallucination' : 'Clean'} 
                      ({(result.result.confidence * 100).toFixed(0)}%)
                    </span>
                    <span className="text-gray-500">{result.timestamp}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    "{result.query.substring(0, 50)}..."
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How to Test:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Add Payment API Entry" above</li>
                <li>Switch to "Knowledge Base + AI" mode</li>
                <li>Ask: "How does the payment API process transactions?"</li>
                <li>You should get a proper answer now</li>
                <li>Check console for hallucination detection logs</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};