import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp, User, Copy, Check, Bot, AlertTriangle } from 'lucide-react';
import { markdownToSafeHTML, sanitizeHTML } from '../utils/sanitizer';
import { Banner } from './Banner';
import { HallucinationWarning } from './HallucinationWarning';
import { HallucinationResult } from '../utils/hallucinationDetector';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isStreaming?: boolean;
  matches?: Array<{
    question: string;
    answer: string;
    score: number;
  }>;
  isAIMode?: boolean;
  matchScore?: number;
  question?: string;
  hallucinationResult?: HallucinationResult;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  isStreaming,
  matches = [],
  isAIMode = false,
  matchScore,
  question,
  hallucinationResult
}) => {
  const [copied, setCopied] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [showHallucinationDetails, setShowHallucinationDetails] = useState(false);

  const isExtractedText = !isUser && message.startsWith('## Extracted Text from Image');
  const isDefaultMessage =
    message === "Hi there! I'm an AI assistant..." ||
    message === 'Chat cleared. How can I help you?';
  const isNoAnswerMessage = message.includes(
    "I'm sorry, but I couldn't find..."
  );
  const isJsonMessage = !isUser && message.trim().startsWith('```json');
  const isAPIResponse = !isUser && (
    message.includes('### API Request Successful') || 
    message.includes('### API Request Failed')
  );

  const shouldShowQuestion = !isUser && question && 
    question.toLowerCase().trim() !== message.toLowerCase().trim() &&
    !isDefaultMessage && !isNoAnswerMessage && !isAPIResponse && !isStreaming;

  const relevantMatches = matches.filter(match => 
    match.score >= 50 && match.score < 100 && 
    match.answer.toLowerCase().trim() !== message.toLowerCase().trim()
  );

  const handleCopy = async () => {
    let textToCopy = message;
    if (isJsonMessage) {
      textToCopy = message
        .replace(/^```json\n/, '')
        .replace(/\n```$/, '')
        .trim();
    }
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMessage = () => {
    if (message.startsWith('<Banner') && message.endsWith('/>')) {
      const textMatch = message.match(/text="([^"]+)"/);
      if (textMatch) {
        return <Banner text={textMatch[1]} />;
      }
    }

    try {
      const streamingStyles = isStreaming ? `
        <style>
          @keyframes fadeIn {
            from { opacity: 0.5; }
            to { opacity: 1; }
          }
          .prose > *:last-child {
            animation: fadeIn 0.2s ease-out;
          }
        </style>
      ` : '';

      const safeHTML = markdownToSafeHTML(message, {
        gfm: true,
        breaks: true,
        pedantic: false,
        smartLists: true,
        smartypants: true,
        headerIds: false,
        mangle: false
      });

      return <div dangerouslySetInnerHTML={{ __html: streamingStyles + safeHTML }} />;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(message) }} />;
    }
  };

  return (
    <div className={`group relative ${isUser ? 'ml-12' : 'mr-12'}`}>
      <div className={`flex gap-4 p-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}

        <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
          {/* Hallucination Warning - Show before the message for AI responses */}
          {!isUser && hallucinationResult && (
            <div className="mb-3">
              <HallucinationWarning 
                result={hallucinationResult}
                showDetails={showHallucinationDetails}
              />
              {hallucinationResult.checks.length > 0 && (
                <button
                  onClick={() => setShowHallucinationDetails(!showHallucinationDetails)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mt-1"
                >
                  <AlertTriangle size={12} />
                  {showHallucinationDetails ? 'Hide' : 'Show'} detection details
                </button>
              )}
            </div>
          )}

          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-blue-500 text-white ml-auto' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}>
            <div className="prose dark:prose-invert prose-sm max-w-none">
              {renderMessage()}
            </div>

            {isStreaming && message.length > 0 && (
              <div className="flex items-center gap-1 mt-2 opacity-60">
                <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          {relevantMatches.length > 0 && !isDefaultMessage && !isNoAnswerMessage && !isStreaming && !isUser && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setShowAllMatches(!showAllMatches)}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showAllMatches ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
                {showAllMatches ? 'Hide similar results' : `Show ${relevantMatches.length} similar results`}
              </button>

              {showAllMatches && (
                <div className="space-y-2">
                  {relevantMatches.map((match, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {match.question}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {match.score}% match
                        </span>
                      </div>
                      <div
                        className="text-xs text-gray-600 dark:text-gray-300 prose dark:prose-invert prose-sm"
                        dangerouslySetInnerHTML={{
                          __html: markdownToSafeHTML(match.answer)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isUser && !isDefaultMessage && !isStreaming && message && !isNoAnswerMessage && (
            <div className="flex justify-start mt-2">
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-all"
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};