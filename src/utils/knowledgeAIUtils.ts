import { OpenAI } from 'openai';
import { storageManager } from './storage/storageManager';
import { QAItem } from '../types/qa';
import { streamResponse } from './chatUtils';
import { maskPII, getPIISummary } from './piiUtils';
import { isIncompleteQuestion, isAPIQuestion } from './chatUtils';
import { HallucinationDetector, HallucinationMitigator, HallucinationResult } from './hallucinationDetector';

// Keep track of conversation history with context
interface ConversationEntry {
  role: string;
  content: string;
  context?: {
    entries: Array<{
      question: string;
      answer: string;
      keywords: string[];
      score: number;
    }>;
  };
  hallucinationCheck?: HallucinationResult;
}

let conversationHistory: ConversationEntry[] = [];

// Minimum match threshold for consistency with regular Knowledge Base mode
const MINIMUM_MATCH_THRESHOLD = 25;

// Add function to clear conversation history
export const clearConversationHistory = (): void => {
  conversationHistory = [];
  console.log('Conversation history cleared');
};

export const generateKnowledgeAIResponse = async (
  question: string,
  onStream: (chunk: string) => void,
  onComplete?: () => void,
  signal?: AbortSignal
): Promise<void> => {
  try {
    // Handle clear memory command
    if (question.toLowerCase().trim() === 'clear memory' || 
        question.toLowerCase().trim() === 'clear chat memory' ||
        question.toLowerCase().trim() === 'clear conversation') {
      clearConversationHistory();
      onStream("Chat memory has been cleared. I've forgotten our previous conversation.");
      onComplete?.();
      return;
    }

    // First check if this is an API question
    if (isAPIQuestion(question)) {
      onStream("I notice you're asking about an API. Please use the Knowledge Base mode to access API documentation and configurations. Switch to Knowledge Base mode using the toggle at the top of the chat.");
      onComplete?.();
      return;
    }

    // Check if the question is incomplete
    const { isIncomplete, reason } = isIncompleteQuestion(question);
    if (isIncomplete) {
      onStream(reason || 'Please provide a complete question.');
      onComplete?.();
      return;
    }

    // Check for PII in the question
    const piiSummary = getPIISummary(question);
    if (piiSummary.hasPII) {
      console.log('PII detected in question:', piiSummary.types);
      question = maskPII(question);
    }

    // Search the knowledge base using the current storage provider
    const provider = storageManager.getCurrentProvider();
    console.log('Using storage provider:', provider.name);

    const searchResults = await provider.searchEntries(question);
    
    // Filter results using the same threshold as regular Knowledge Base mode
    const relevantResults = searchResults
      .filter(result => result.score >= MINIMUM_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score);
    
    const hasRelevantResults = relevantResults.length > 0;
    const bestMatch = hasRelevantResults ? relevantResults[0] : null;

    // Get OpenAI token
    const token = import.meta.env.VITE_OPENAI_API_KEY;
    if (!token) {
      throw new Error('TOKEN_REQUIRED');
    }

    const openai = new OpenAI({
      apiKey: token,
      dangerouslyAllowBrowser: true,
    });

    // If no relevant matches found, try to use conversation history
    if (!hasRelevantResults) {
      // Get previous context from conversation history
      const previousContext = conversationHistory
        .filter(entry => entry.context?.entries && entry.context.entries.length > 0)
        .slice(-3) // Look at last 3 interactions with context
        .map(entry => entry.context?.entries || [])
        .flat();

      if (previousContext.length > 0) {
        // Create system message for follow-up handling
        const systemMessage = `You are a helpful AI assistant. A user is asking a follow-up question that doesn't have a direct match in the knowledge base. Use the previous conversation context to help answer their question. If you cannot answer based on the available context, clearly state that and suggest asking a new, more specific question.

Previous Context:
${previousContext.map((entry, i) => `
Context ${i + 1}:
Q: ${entry.question}
A: ${entry.answer}
Keywords: ${entry.keywords.join(', ')}
`).join('\n')}

Current question: ${question}

Rules:
1. Only use information from the provided context
2. If you can't answer based on context, say so clearly
3. Don't make assumptions or use external knowledge
4. If relevant, reference specific parts of previous answers`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            ...conversationHistory.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: question }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          stream: false,
        });

        if (response.choices && response.choices.length > 0) {
          let answer = response.choices[0].message.content || '';

          // **HALLUCINATION DETECTION - Example 1: Context-based validation**
          const contextStrings = previousContext.map(entry => `${entry.question} ${entry.answer}`);
          const hallucinationResult = HallucinationDetector.detectHallucination(
            answer,
            contextStrings,
            question,
            0.8 // Simulated confidence score
          );

          console.log('Hallucination Detection Result:', hallucinationResult);

          // Apply mitigation if hallucination detected
          if (hallucinationResult.isHallucination) {
            console.warn('Potential hallucination detected in follow-up response');
            answer = hallucinationResult.mitigatedResponse || answer;
            
            // Add warning to user
            if (hallucinationResult.warnings.length > 0) {
              answer = `⚠️ ${hallucinationResult.warnings[0]}\n\n${answer}`;
            }
          }

          // Check for PII in the response
          const responsePIISummary = getPIISummary(answer);
          if (responsePIISummary.hasPII) {
            console.warn('PII detected in response:', responsePIISummary.types);
            answer = maskPII(answer);
          }

          // Add the follow-up Q&A to conversation history with hallucination check
          conversationHistory.push({
            role: 'user',
            content: question
          });
          conversationHistory.push({
            role: 'assistant',
            content: answer,
            context: { entries: previousContext },
            hallucinationCheck: hallucinationResult
          });

          // Stream the response
          await streamResponse(answer, onStream, signal);
          onComplete?.();
          return;
        }
      }

      // If no previous context or no response, return standard no-match message
      const noMatchMessage = 
        "I couldn't find a relevant answer in the knowledge base or previous conversation. Please try:\n\n" +
        "1. Rephrasing your question\n" +
        "2. Adding more specific details\n" +
        "3. Starting a new topic with a clear, specific question";
      
      onStream(noMatchMessage);
      onComplete?.();
      return;
    }

    // Format knowledge base entries for context
    const currentContext = relevantResults.map((result) => ({
      question: result.entry.question,
      answer: result.entry.answer,
      keywords: result.entry.keywords,
      score: result.score,
    }));

    // Create system message with strict context usage instructions
    const systemMessage = `You are a helpful AI assistant that MUST ONLY use the provided knowledge base entries and conversation context to answer questions. Follow these strict rules:

1. ONLY use information from:
   - The provided knowledge base entries (prioritize entries with higher match scores)
   - Previous conversation context that references those entries
   - Do NOT use any external knowledge

2. If the question cannot be answered using ONLY the provided context:
   - Clearly state that you cannot find relevant information in the knowledge base
   - Do NOT attempt to answer using external knowledge
   - Suggest rephrasing the question

3. For follow-up questions:
   - ONLY reference previous context if it relates to the provided knowledge base entries
   - Maintain consistency with previous answers about the knowledge base content
   - If the follow-up goes beyond the provided context, state that you cannot answer

4. Response Format:
   - Keep responses natural and conversational
   - Do not mention that you're using knowledge base entries
   - Do not apologize for limitations

Knowledge Base Context:
${currentContext.map((entry, i) => `
Entry ${i + 1} (${entry.score}% relevant):
Q: ${entry.question}
A: ${entry.answer}
Keywords: ${entry.keywords.join(', ')}
`).join('\n')}`;

    // Add the current question to conversation history with context
    conversationHistory.push({
      role: 'user',
      content: question,
      context: { entries: currentContext }
    });

    // Keep only the last 6 messages for context
    if (conversationHistory.length > 6) {
      conversationHistory = conversationHistory.slice(-6);
    }

    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.3, // Lower temperature for more focused responses
      max_tokens: 1000,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      let answer = response.choices[0].message.content || '';

      // **HALLUCINATION DETECTION - Example 2: Knowledge base validation**
      const knowledgeBaseEntries = currentContext.map(entry => ({
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords
      }));

      const hallucinationResult = HallucinationDetector.validateAgainstKnowledgeBase(
        answer,
        knowledgeBaseEntries
      );

      console.log('Knowledge Base Validation Result:', hallucinationResult);

      // Apply confidence-based filtering
      if (hallucinationResult.confidence < 0.7) {
        answer = HallucinationMitigator.applyConfidenceFilter(answer, hallucinationResult.confidence);
      }

      // Add source attribution
      const sources = currentContext.map(entry => entry.question);
      if (hallucinationResult.confidence < 0.8) {
        answer = HallucinationMitigator.addSourceAttribution(answer, sources);
      }

      // Apply uncertainty quantification for low confidence responses
      if (hallucinationResult.confidence < 0.6) {
        answer = HallucinationMitigator.quantifyUncertainty(answer, 'high');
      } else if (hallucinationResult.confidence < 0.8) {
        answer = HallucinationMitigator.quantifyUncertainty(answer, 'medium');
      }

      // Check for PII in the response
      const responsePIISummary = getPIISummary(answer);
      if (responsePIISummary.hasPII) {
        console.warn('PII detected in response:', responsePIISummary.types);
        answer = maskPII(answer);
      }

      // Add the assistant's response to conversation history with context and hallucination check
      conversationHistory.push({
        role: 'assistant',
        content: answer,
        context: { entries: currentContext },
        hallucinationCheck: hallucinationResult
      });

      // Stream the response with the match score from the best match
      await streamResponse(answer, onStream, signal, bestMatch.score);
    }

    onComplete?.();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_REQUIRED') {
        throw error;
      }
      if (error.message !== 'Request aborted') {
        onStream(`Error: ${error.message}`);
      }
    } else {
      onStream('An unexpected error occurred');
    }
    onComplete?.();
  }
};