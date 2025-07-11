import { QAItem } from '../types/qa';
import { maskPII, getPIISummary } from './piiUtils';
import { isAPIQuestion } from './chatUtils';
import { HallucinationDetector, HallucinationMitigator } from './hallucinationDetector';

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
  hallucinationCheck?: any;
}

let conversationHistory: ConversationEntry[] = [];

// Add function to clear conversation history
export const clearLocalConversationHistory = (): void => {
  conversationHistory = [];
  console.log('Local LLM conversation history cleared');
};

// Update the model name and improve streaming
export const generateLocalLLMResponse = async (
  question: string,
  context: Array<{ entry: QAItem; score: number }>,
  onStream: (chunk: string) => void,
  onComplete?: () => void,
  signal?: AbortSignal
): Promise<void> => {
  try {
    // First check if this is an API question
    if (isAPIQuestion(question)) {
      onStream("I notice you're asking about an API. Please use the Knowledge Base mode to access API documentation and configurations. Switch to Knowledge Base mode using the toggle at the top of the chat.");
      onComplete?.();
      return;
    }

    // First check if we have any relevant matches
    if (!context || context.length === 0) {
      // If no direct matches, check conversation history for context
      const previousContext = conversationHistory
        .filter(entry => entry.context?.entries && entry.context.entries.length > 0)
        .slice(-3); // Look at last 3 interactions with context

      if (previousContext.length > 0) {
        console.log('No direct matches found, using conversation history for context');
        const contextEntries = previousContext
          .map(entry => entry.context?.entries || [])
          .flat();

        // Format context for follow-up question
        const contextText = contextEntries
          .map(({ question, answer }) => `Previous Q: ${question}\nPrevious A: ${answer}\n`)
          .join('\n');

        // Create prompt for follow-up question
        const followUpPrompt = `Based on the previous conversation context, please answer this follow-up question. Only use information from the context provided.

Previous Context:
${contextText}

Follow-up Question: ${question}

Instructions:
1. Only use information from the provided context
2. If you cannot answer based on the context, say so clearly
3. Keep your response focused and natural
4. Do not mention that you're using previous context`;

        // Make request to Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3:2b',
            prompt: followUpPrompt,
            stream: true,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              top_k: 50,
              repeat_penalty: 1.1,
              stop: ['Question:', 'Context:', 'Instructions:'],
              num_predict: 1024,
            }
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to get response from Llama model');
        }

        const reader = response.body.getReader();
        let currentResponse = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const json = JSON.parse(line);
                if (json.error) {
                  throw new Error(json.error);
                }
                if (json.response) {
                  buffer += json.response;
                  
                  if (buffer.match(/[\s\n.!?,;:]$/)) {
                    currentResponse += buffer;
                    onStream(currentResponse);
                    buffer = '';
                  }
                }
              } catch (error) {
                if (error instanceof SyntaxError) continue;
                throw error;
              }
            }
          }

          // Flush remaining buffer
          if (buffer) {
            currentResponse += buffer;
            onStream(currentResponse);
          }

          // **HALLUCINATION DETECTION - Example 4: Local LLM with context validation**
          const contextStrings = contextEntries.map(entry => `${entry.question} ${entry.answer}`);
          const hallucinationResult = HallucinationDetector.detectHallucination(
            currentResponse,
            contextStrings,
            question,
            0.7 // Local LLM typically has lower confidence
          );

          console.log('Local LLM Hallucination Check:', hallucinationResult);

          // Apply mitigation for local LLM responses
          if (hallucinationResult.isHallucination) {
            console.warn('Potential hallucination detected in local LLM response');
            
            // Add local LLM disclaimer
            const mitigatedResponse = `🖥️ **Local AI Response**\n\n${currentResponse}\n\n⚠️ *This response is generated by a local AI model. For more reliable information, consider using Knowledge Base mode or verifying with external sources.*`;
            onStream(mitigatedResponse);
          }

          // Add to conversation history
          conversationHistory.push({
            role: 'user',
            content: question,
            context: { entries: contextEntries }
          });

          conversationHistory.push({
            role: 'assistant',
            content: currentResponse,
            hallucinationCheck: hallucinationResult
          });

          // Keep history manageable
          if (conversationHistory.length > 6) {
            conversationHistory = conversationHistory.slice(-6);
          }

          onComplete?.();
          return;
        } finally {
          reader.releaseLock();
        }
      }

      // No context found in history
      onStream("I couldn't find any relevant information in the knowledge base or previous conversation to answer your question. Please try:\n\n" +
              "1. Rephrasing your question\n" +
              "2. Adding more specific details\n" +
              "3. Starting a new topic with a clear, specific question");
      onComplete?.();
      return;
    }

    // Take only top 2 most relevant matches
    const topMatches = context
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    // Format context for the model
    const contextText = topMatches
      .map(({ entry, score }) => 
        `[Score: ${score}%]\nQ: ${entry.question}\nA: ${entry.answer}\n`
      )
      .join('\n');

    // Get previous conversation context
    const previousContext = conversationHistory
      .filter(entry => entry.context?.entries && entry.context.entries.length > 0)
      .slice(-3)
      .map(entry => entry.context?.entries || [])
      .flat();

    // Check for PII in the question
    const piiSummary = getPIISummary(question);
    if (piiSummary.hasPII) {
      console.warn('PII detected in question:', piiSummary.types);
      question = maskPII(question);
    }

    // Prepare the prompt with conversation history
    const prompt = `You are a helpful AI assistant. Use the following context and conversation history to answer the question. Only use information from the provided context.

Previous Conversation:
${previousContext.map((entry, i) => `
Context ${i + 1}:
Q: ${entry.question}
A: ${entry.answer}
Keywords: ${entry.keywords.join(', ')}
`).join('\n')}

Current Context:
${contextText}

Current Question: ${question}

Instructions:
1. Base your answer only on the provided context and conversation history
2. If the context doesn't contain relevant information, say so clearly
3. Keep your response focused and concise
4. Use markdown formatting for better readability
5. If answering a follow-up question, reference previous context when relevant
6. Do not make assumptions or use external knowledge

Answer:`;

    // First check if Ollama is accessible
    try {
      const healthCheck = await fetch('http://localhost:11434/api/health')
        .catch(() => null);
      
      if (!healthCheck?.ok) {
        throw new Error(
          'Cannot connect to Ollama service. Please ensure:\n\n' +
          '1. Ollama is running (run `ollama serve`)\n' +
          '2. The service is accessible at http://localhost:11434\n' +
          '3. You have pulled the llama3 model (run `ollama pull llama3:2b`)\n\n' +
          'If Ollama is running but still getting this error, try:\n' +
          '1. Restart Ollama with: `OLLAMA_ORIGINS=http://localhost:3000 ollama serve`\n' +
          '2. Check if any firewall is blocking port 11434'
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Ollama service');
    }

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:2b',
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          repeat_penalty: 1.1,
          stop: ['Question:', 'Context:', 'Instructions:'],
          num_predict: 1024,
        }
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Ollama service error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error?.includes('model not found')) {
          errorMessage = 'The llama3 model is not installed. Please run:\n\n' +
                        '```bash\nollama pull llama3:2b\n```\n\n' +
                        'Then try again.';
        } else {
          errorMessage += `: ${errorData.error || errorData.message || 'Unknown error'}`;
        }
      } catch {
        errorMessage += `: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('No response body from Ollama service');
    }

    const reader = response.body.getReader();
    let currentResponse = '';
    let buffer = ''; // Add buffer for smoother text flow

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const json = JSON.parse(line);
            if (json.error) {
              throw new Error(json.error);
            }
            if (json.response) {
              // Accumulate text in buffer
              buffer += json.response;
              
              // Stream when we have a complete word or punctuation
              if (buffer.match(/[\s\n.!?,;:]$/)) {
                currentResponse += buffer;
                onStream(currentResponse);
                buffer = '';
              }
            }
          } catch (error) {
            if (error instanceof SyntaxError) {
              console.warn('Error parsing JSON chunk:', error);
              continue;
            }
            throw error;
          }
        }
      }

      // Flush any remaining buffer
      if (buffer) {
        currentResponse += buffer;
        onStream(currentResponse);
      }

      // **HALLUCINATION DETECTION - Example 5: Local LLM with knowledge base context**
      const knowledgeBaseEntries = topMatches.map(match => ({
        question: match.entry.question,
        answer: match.entry.answer,
        keywords: match.entry.keywords || []
      }));

      const hallucinationResult = HallucinationDetector.validateAgainstKnowledgeBase(
        currentResponse,
        knowledgeBaseEntries
      );

      console.log('Local LLM Knowledge Base Validation:', hallucinationResult);

      // Apply local LLM specific mitigation
      if (hallucinationResult.isHallucination || hallucinationResult.confidence < 0.7) {
        console.warn('Potential hallucination or low confidence in local LLM response');
        
        // Add local LLM disclaimer with confidence info
        const disclaimer = `\n\n🖥️ **Local AI Response** (Confidence: ${(hallucinationResult.confidence * 100).toFixed(1)}%)\n*This response is generated by a local AI model and should be verified independently.*`;
        const finalResponse = currentResponse + disclaimer;
        onStream(finalResponse);
      }

      // Check for PII in the response
      const responsePIISummary = getPIISummary(currentResponse);
      if (responsePIISummary.hasPII) {
        console.warn('PII detected in response:', responsePIISummary.types);
        currentResponse = maskPII(currentResponse);
        onStream(currentResponse);
      }

      // Add the Q&A to conversation history
      conversationHistory.push({
        role: 'user',
        content: question,
        context: { entries: topMatches.map(match => ({
          question: match.entry.question,
          answer: match.entry.answer,
          keywords: match.entry.keywords || [],
          score: match.score
        }))}
      });

      conversationHistory.push({
        role: 'assistant',
        content: currentResponse,
        hallucinationCheck: hallucinationResult
      });

      // Keep only the last 6 messages for context
      if (conversationHistory.length > 6) {
        conversationHistory = conversationHistory.slice(-6);
      }
    } catch (error) {
      throw error;
    } finally {
      reader.releaseLock();
    }

    onComplete?.();
  } catch (error) {
    console.error('Local LLM error:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      onStream(`Error: ${error.message}`);
    } else {
      onStream('An unexpected error occurred while connecting to the local LLM service');
    }
    onComplete?.();
  }
};