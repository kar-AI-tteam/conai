import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { HallucinationResult } from '../utils/hallucinationDetector';

interface HallucinationWarningProps {
  result: HallucinationResult;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export const HallucinationWarning: React.FC<HallucinationWarningProps> = ({
  result,
  onDismiss,
  showDetails = false
}) => {
  if (!result.isHallucination && result.confidence > 0.8) {
    return null; // Don't show warning for high-confidence, non-hallucinated responses
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle2;
    if (confidence >= 0.6) return AlertTriangle;
    return XCircle;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getBorderColor = (confidence: number) => {
    if (confidence >= 0.8) return 'border-green-200 dark:border-green-800';
    if (confidence >= 0.6) return 'border-yellow-200 dark:border-yellow-800';
    return 'border-red-200 dark:border-red-800';
  };

  const getBackgroundColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 dark:bg-green-900/20';
    if (confidence >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const ConfidenceIcon = getConfidenceIcon(result.confidence);

  return (
    <div className={`rounded-lg border p-3 mb-4 ${getBorderColor(result.confidence)} ${getBackgroundColor(result.confidence)}`}>
      <div className="flex items-start gap-3">
        <ConfidenceIcon 
          size={20} 
          className={`flex-shrink-0 mt-0.5 ${getConfidenceColor(result.confidence)}`} 
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
              {getConfidenceLabel(result.confidence)} ({(result.confidence * 100).toFixed(1)}%)
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>

          {result.warnings.length > 0 && (
            <div className="mt-1">
              {result.warnings.map((warning, index) => (
                <p key={index} className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                  {warning}
                </p>
              ))}
            </div>
          )}

          {showDetails && result.checks.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Detection Details:
              </p>
              {result.checks.map((check, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium capitalize">{check.type}:</span> {check.description}
                  {check.suggestion && (
                    <div className="ml-2 text-gray-500 dark:text-gray-500">
                      💡 {check.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.confidence < 0.7 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <strong>Recommendation:</strong> Verify this information with additional sources or 
              switch to Knowledge Base mode for more reliable answers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};