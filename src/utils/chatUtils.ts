import { formatJSON, formatMessageWithJSON, isLikelyJSON } from './jsonUtils';
import { QUESTION_PREFIXES } from './constants/questionPrefixes';
import { QAItem } from '../types/qa';

/**
 * Stream a response with optional match score
 */
export const streamResponse = async (
  text: string,
  onStream: (chunk: string, matchScore?: number) => void,
  signal?: AbortSignal,
  matchScore?: number
): Promise<void> => {
  if (signal?.aborted) return;

  const formattedText = formatMessageWithJSON(text);
  const totalLength = formattedText.length;
  const chunkSize = totalLength < 1000 ? 3 : 25;
  
  const chunks = formattedText.match(new RegExp(`(.{1,${chunkSize}}[\\s.!?,]|.{1,${chunkSize}})`, 'g')) || [];
  let currentText = '';
  
  // Send initial chunk with match score
  if (matchScore !== undefined) {
    onStream('', matchScore);
  }
  
  for (const chunk of chunks) {
    if (signal?.aborted) return;
    
    currentText += chunk;
    onStream(currentText, matchScore);
    
    const delay = totalLength < 1000 ? 20 : 5;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

/**
 * Check if a question is likely incomplete
 */
export const isIncompleteQuestion = (question: string): { isIncomplete: boolean; reason?: string } => {
  // Skip question validation for JSON formatting requests
  if (isJsonFormatRequest(question)) {
    return { isIncomplete: false };
  }

  const normalized = question.toLowerCase().trim();
  
  console.log('\n=== Question Validation ===');
  console.log('Original question:', question);
  console.log('Normalized question:', normalized);

  // Common incomplete question patterns with strict matching
  const incompletePatterns = [
    { 
      pattern: /^(who|what|where|when|why|how)\s*(is|are|was|were)?\s*$/i, 
      message: "Please complete your question with what you want to know about.\n\nFor example:\n❌ \"who is\"\n✅ \"who is Albert Einstein?\"" 
    },
    { 
      pattern: /^(can|could|would|should|will)\s*$/i, 
      message: "Please finish your question.\n\nFor example:\n❌ \"can\"\n✅ \"can I use this feature?\"" 
    },
    { 
      pattern: /^(tell me|explain|describe|define)\s*$/i, 
      message: "What would you like to know about?\n\nFor example:\n❌ \"explain\"\n✅ \"explain how databases work\"" 
    },
    { 
      pattern: /^(show|list|give)\s*$/i, 
      message: "Please specify what you'd like to see.\n\nFor example:\n❌ \"show\"\n✅ \"show all available features\"" 
    }
  ];

  // Check for incomplete patterns - STRICT MATCHING
  for (const { pattern, message } of incompletePatterns) {
    console.log('\nTesting pattern:', pattern);
    if (pattern.test(normalized)) {
      console.log('❌ Pattern matched - Question is incomplete');
      console.log('Reason:', message);
      return { isIncomplete: true, reason: message };
    }
    console.log('✓ Pattern did not match');
  }

  // Additional strict checks for incomplete questions
  console.log('\nTesting question word + is/are pattern');
  if (/^(who|what|where|when|why|how)\s+(is|are|was|were)\s*$/i.test(normalized)) {
    const reason = "Please complete your question with what you want to know about.\n\nFor example:\n❌ \"what is\"\n✅ \"what is artificial intelligence?\"";
    console.log('❌ Matched incomplete question word pattern');
    console.log('Reason:', reason);
    return { isIncomplete: true, reason };
  }
  console.log('✓ Not a bare question word + is/are');

  // Check for questions that are just question words
  console.log('\nTesting single question words');
  if (/^(who|what|where|when|why|how)$/i.test(normalized)) {
    const reason = "Please complete your question.\n\nFor example:\n❌ \"what\"\n✅ \"what is machine learning?\"";
    console.log('❌ Matched single question word');
    console.log('Reason:', reason);
    return { isIncomplete: true, reason };
  }
  console.log('✓ Not a single question word');

  // Check for minimum word count and question completeness
  const words = normalized.split(/\s+/);
  console.log('\nWord count check:');
  console.log('Words:', words);
  console.log('Word count:', words.length);
  console.log('Ends with question mark:', normalized.endsWith('?'));

  if (words.length < 2 && !normalized.endsWith('?')) {
    const reason = "Your question seems incomplete. Please provide more details for a better answer.\n\nFor example:\n❌ \"database\"\n✅ \"what is a database?\"";
    console.log('❌ Question too short and no question mark');
    console.log('Reason:', reason);
    return { isIncomplete: true, reason };
  }

  console.log('\n✅ Question passed all validation checks');
  return { isIncomplete: false };
};

/**
 * Check if a message is a JSON formatting request
 */
export const isJsonFormatRequest = (message: string): boolean => {
  const normalizedMessage = message.trim().toLowerCase();
  return normalizedMessage.startsWith('format json') || 
         normalizedMessage.startsWith('json format') ||
         normalizedMessage === 'format json' ||
         normalizedMessage === 'json format';
};

/**
 * Extract JSON content from a message
 */
export const extractJsonContent = (message: string): string => {
  const normalizedMessage = message.trim().toLowerCase();
  let content = '';
  
  if (normalizedMessage.startsWith('format json')) {
    content = message.substring('format json'.length).trim();
  } else if (normalizedMessage.startsWith('json format')) {
    content = message.substring('json format'.length).trim();
  }

  // If no content after command, check if there's a code block
  if (!content && message.includes('```')) {
    const matches = message.match(/```(?:json|python)?\s*([\s\S]*?)```/);
    if (matches && matches[1]) {
      content = matches[1].trim();
    }
  }

  // If still no content, return the original message without the command
  if (!content) {
    content = message.replace(/^(?:format json|json format)/i, '').trim();
  }

  return content;
};

/**
 * Check if a question is API-related based on entry type
 */
export const isAPIQuestion = (entry: QAItem | undefined): boolean => {
  if (!entry) return false;
  return entry.entryType === 'api';
};

/**
 * Check if a message is a banner command
 */
export const isBannerCommand = (message: string): boolean => {
  return message.toLowerCase().startsWith('/banner');
};

/**
 * Extract banner text from command
 */
export const extractBannerText = (message: string): string => {
  const match = message.match(/^\/banner\s*["'](.+?)["']/i);
  return match ? match[1].trim() : '';
};

/**
 * Handle banner command and generate banner JSX
 */
export const handleBannerCommand = (message: string): string => {
  const bannerText = extractBannerText(message);
  if (!bannerText) {
    return 'Please provide text for the banner in quotes. Example: /banner "Hello World"';
  }
  
  return `<Banner text="${bannerText}" />`;
};

/**
 * Check if a message is a clear memory command
 */
export const isClearMemoryCommand = (message: string): boolean => {
  const normalizedMessage = message.trim().toLowerCase();
  return normalizedMessage === '/clear' || 
         normalizedMessage === 'clear memory' ||
         normalizedMessage === '/clear memory' ||
         normalizedMessage === 'clear';
};