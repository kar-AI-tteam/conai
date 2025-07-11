import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeBaseChat, KnowledgeAIChat, AIAssistantChat } from '../components/chat';
import { ChatInput } from '../components/ChatInput';
import { HallucinationTestPanel } from '../components/HallucinationTestPanel';
import { generateLLMResponse } from '../utils/llmUtils';
import { generateLocalLLMResponse } from '../utils/llmLocalUtils';
import { generateKnowledgeAIResponse, clearConversationHistory } from '../utils/knowledgeAIUtils';
import { extractTextFromImage } from '../utils/imageUtils';
import { APIConfirmDialog } from '../components/APIConfirmDialog';
import { Chat, QAItem } from '../types/qa';
import { StorageType } from '../utils/storage/types';
import { storageManager } from '../utils/storage/storageManager';
import { isJsonFormatRequest, extractJsonContent, isIncompleteQuestion, isAPIQuestion, isBannerCommand, handleBannerCommand, isClearMemoryCommand } from '../utils/chatUtils';
import { formatJSON } from '../utils/jsonUtils';
import { triggerAPI, formatAPIResponse } from '../utils/apiUtils';
import { TrainFront, Sparkles, Cpu } from 'lucide-react';
import { checkConnections, formatConnectionStatus } from '../utils/connectionUtils';

interface ChatPageProps {
  chats: Chat[];
  currentChatId: string;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  aiModel: 'knowledge' | 'ai' | 'knowledge-ai' | 'knowledge-ai-local';
  storageType: StorageType;
  streamingEnabled: boolean;
}

export function ChatPage({
  chats,
  currentChatId,
  setChats,
  aiModel,
  storageType,
  streamingEnabled
}: ChatPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pendingAPIConfig, setPendingAPIConfig] = useState<any>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const isAIMode = aiModel === 'knowledge-ai' || aiModel === 'ai' || aiModel === 'knowledge-ai-local';
  const isKnowledgeAIMode = aiModel === 'knowledge-ai' || aiModel === 'knowledge-ai-local';

  // Enhanced scroll to bottom function
  const scrollToBottom = React.useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior, 
          block: 'end',
          inline: 'nearest'
        });
      }
      
      // Fallback: direct scroll on container
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        if (behavior === 'auto') {
          container.scrollTop = container.scrollHeight;
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (currentChat && currentChat.messages.length > 0) {
      // Use a small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottom(isLoading || isStreaming ? 'auto' : 'smooth');
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chats, currentChatId, isLoading, isStreaming, scrollToBottom]);

  // Additional scroll trigger for streaming
  useEffect(() => {
    if (isStreaming || isLoading) {
      const intervalId = setInterval(() => {
        scrollToBottom('auto');
      }, 100);
      
      return () => clearInterval(intervalId);
    }
  }, [isStreaming, isLoading, scrollToBottom]);

  const handleTestQuery = (query: string) => {
    console.log('🧪 Running hallucination test query:', query);
    handleSendMessage(query);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const provider = storageManager.getCurrentProvider();
      const results = await provider.searchEntries(query);
      
      if (results.length === 0) {
        setChats(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { text: `/search ${query}`, isUser: true },
                    {
                      text: "I'm sorry, but I couldn't find any relevant answers in my knowledge base. Please try:\n\n" +
                           "1. Rephrasing your question\n" +
                           "2. Using different keywords\n" +
                           "3. Checking if your question is related to the available topics",
                      isUser: false
                    }
                  ]
                }
              : chat
          )
        );
        return;
      }

      // Format search results as a chat message
      const searchResultsMessage = formatSearchResults(results);
      
      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { text: `/search ${query}`, isUser: true },
                  { text: searchResultsMessage, isUser: false }
                ],
                isDraft: false
              }
            : chat
        )
      );
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { text: `/search ${query}`, isUser: true },
                  {
                    text: `Error performing search: ${errorMessage}`,
                    isUser: false
                  }
                ]
              }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSearchResults = (results: Array<{ entry: QAItem; score: number; highlights: any }>) => {
    // Group results by entry type
    const textEntries = results.filter(r => !r.entry.entryType || r.entry.entryType === 'text');
    const apiEntries = results.filter(r => r.entry.entryType === 'api');

    let message = '### Search Results\n\n';

    if (apiEntries.length > 0) {
      message += '#### API Entries\n\n';
      apiEntries.forEach(({ entry, score }) => {
        message += `**Q:** ${entry.question}\n`;
        try {
          const config = JSON.parse(entry.answer);
          message += `\`${config.method || 'GET'} ${config.endpoint || ''}\`\n`;
          if (config.description) {
            message += `${config.description}\n`;
          }
        } catch {
          message += `_(See API configuration)_\n`;
        }
        message += `_(${score}% match)_\n\n`;
      });
    }

    if (textEntries.length > 0) {
      message += '#### Knowledge Base Entries\n\n';
      textEntries.forEach(({ entry, score }) => {
        const answer = entry.answer.split('\n').slice(0, 2).join('\n'); // Get first 2 lines
        message += `**Q:** ${entry.question}\n`;
        message += `**A:** ${answer}${entry.answer.split('\n').length > 2 ? '...' : ''}\n`;
        message += `_(${score}% match)_\n\n`;
      });
    }

    return message;
  };

  const handleSendMessage = async (message: string) => {
    if (isLoading || !currentChatId) return;

    try {
      // Add user message to chat
      const updatedMessages = [
        ...chats.find(chat => chat.id === currentChatId)?.messages || [],
        { text: message, isUser: true },
      ];

      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: updatedMessages,
                title: chat.isDraft
                  ? message.slice(0, 30) + (message.length > 30 ? '...' : '')
                  : chat.title,
                isDraft: false,
              }
            : chat
        )
      );

      // Scroll immediately after adding user message
      setTimeout(() => scrollToBottom('auto'), 50);

      // Handle clear memory command
      if (isClearMemoryCommand(message)) {
        if (aiModel === 'knowledge-ai') {
          clearConversationHistory();
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: 'Chat memory has been cleared. I\'ve forgotten our previous conversation.', isUser: false }
                    ]
                  }
                : chat
            )
          );
        } else {
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: 'Memory clearing is only available in Knowledge Base + AI mode.', isUser: false }
                    ]
                  }
                : chat
            )
          );
        }
        return;
      }

      // Handle special commands (banner, connections, etc.)
      if (isBannerCommand(message)) {
        const bannerResponse = handleBannerCommand(message);
        setChats(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { text: bannerResponse, isUser: false }
                  ]
                }
              : chat
          )
        );
        return;
      }

      if (message.toLowerCase() === '/check connections' || 
          message.toLowerCase() === '/check my connections') {
        try {
          setIsLoading(true);
          const statuses = await checkConnections();
          const statusMessage = formatConnectionStatus(statuses);
          
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: statusMessage, isUser: false }
                    ]
                  }
                : chat
            )
          );
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to check connections';
          
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: `Error checking connections: ${errorMessage}`, isUser: false }
                    ]
                  }
                : chat
            )
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (isJsonFormatRequest(message)) {
        try {
          const jsonContent = extractJsonContent(message);
          if (!jsonContent) {
            setChats(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: [
                        ...chat.messages,
                        {
                          text: 'Please provide the JSON content you want to format.\n\n**Examples:**\n- `format json {"name": "value"}`\n- `prettify json [1,2,3]`\n- Or paste JSON after typing "format json"',
                          isUser: false,
                        },
                      ],
                    }
                  : chat
              )
            );
            return;
          }

          const formattedJson = formatJSON(jsonContent);
          
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: formattedJson, isUser: false },
                    ],
                    title: chat.isDraft ? 'JSON Formatting' : chat.title,
                  }
                : chat
            )
          );
          return;
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to format JSON';
          
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { text: `Error: ${errorMessage}`, isUser: false },
                    ],
                  }
                : chat
            )
          );
          return;
        }
      }

      setIsLoading(true);
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        // Search for entries
        const provider = storageManager.getCurrentProvider();
        const searchResults = await provider.searchEntries(message);
        
        // Filter results above 50% threshold and exclude empty answers
        const relevantResults = searchResults
          .filter(result => result.score >= 50 && result.entry.answer.trim() !== '');

        const bestMatch = relevantResults.length > 0 ? relevantResults[0] : null;
        const additionalMatches = relevantResults.slice(1);

        // Update the API question check in handleSendMessage
        if (bestMatch && isAPIQuestion(bestMatch.entry)) {
          console.log('API entry found:', bestMatch.entry);
          setPendingMessage(message);
          
          try {
            const apiConfig = JSON.parse(bestMatch.entry.answer);
            console.log('Parsed API config:', apiConfig);
            
            setPendingAPIConfig(apiConfig);
            setShowAPIDialog(true);
            setIsLoading(false);
            setIsStreaming(false);
            return;
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Invalid API configuration';
            
            setChats(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: [
                        ...chat.messages,
                        {
                          text: `Error: ${errorMessage}`,
                          isUser: false,
                        },
                      ],
                    }
                  : chat
              )
            );
            setIsLoading(false);
            setIsStreaming(false);
            return;
          }
        }

        // If no matches found or empty answer, show the "no relevant answers" message
        if (!bestMatch) {
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      {
                        text: "I'm sorry, but I couldn't find any relevant answers in my knowledge base. Please try:\n\n" +
                             "1. Rephrasing your question\n" +
                             "2. Using different keywords\n" +
                             "3. Checking if your question is related to the available topics",
                        isUser: false
                      }
                    ]
                  }
                : chat
            )
          );
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        // Handle different AI modes
        if (aiModel === 'knowledge') {
          const { isIncomplete, reason } = isIncompleteQuestion(message);
          if (isIncomplete) {
            setChats(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: [
                        ...chat.messages,
                        {
                          text: reason || 'Please provide a complete question.',
                          isUser: false,
                        },
                      ],
                    }
                  : chat
              )
            );
            setIsLoading(false);
            setIsStreaming(false);
            return;
          }

          const answer = bestMatch.entry.answer;
          const matchScore = bestMatch.score;

          if (streamingEnabled) {
            let currentText = '';
            const lines = answer.split('\n');
            const streamChunks: string[] = [];
            
            for (const line of lines) {
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
                streamChunks.push(line + '\n');
              } else {
                const chunks = line.match(/(.{1,3}[.\s]|.{1,3})/g) || [];
                streamChunks.push(...chunks);
                if (line.trim()) streamChunks.push('\n');
              }
            }
            
            for (const chunk of streamChunks) {
              if (abortControllerRef.current?.signal.aborted) {
                break;
              }
              
              currentText += chunk;
              setChats(prev =>
                prev.map(chat =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: [
                          ...updatedMessages,
                          {
                            text: currentText,
                            isUser: false,
                            matchScore,
                            matches: additionalMatches.map(match => ({
                              question: match.entry.question,
                              answer: match.entry.answer,
                              score: match.score
                            })),
                            ...(isStreaming ? {} : { question: message }),
                          },
                        ],
                      }
                    : chat
                )
              );
              
              await new Promise(resolve => setTimeout(resolve, 20));
              scrollToBottom('auto');
            }
          } else {
            // Non-streaming response
            setChats(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: [
                        ...updatedMessages,
                        {
                          text: answer,
                          isUser: false,
                          matchScore,
                          matches: additionalMatches.map(match => ({
                            question: match.entry.question,
                            answer: match.entry.answer,
                            score: match.score
                          })),
                          question: message
                        },
                      ],
                    }
                  : chat
              )
            );
          }
        } else if (aiModel === 'knowledge-ai-local') {
          await generateLocalLLMResponse(
            message,
            relevantResults,
            chunk => {
              setChats(prev =>
                prev.map(chat =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: [
                          ...updatedMessages,
                          {
                            text: chunk,
                            isUser: false,
                            question: message,
                            isStreaming: true
                          },
                        ],
                      }
                    : chat
                )
              );
              scrollToBottom('auto');
            },
            () => {
              setIsLoading(false);
              setIsStreaming(false);
              setChats(prev =>
                prev.map(chat =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: chat.messages.map((msg, idx) =>
                          idx === chat.messages.length - 1
                            ? { ...msg, isStreaming: false }
                            : msg
                        ),
                      }
                    : chat
                )
              );
            },
            abortControllerRef.current.signal
          );
        } else if (aiModel === 'knowledge-ai') {
          await generateKnowledgeAIResponse(
            message,
            chunk => {
              setChats(prev =>
                prev.map(chat =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: [
                          ...updatedMessages,
                          {
                            text: chunk,
                            isUser: false,
                            question: message,
                          },
                        ],
                      }
                    : chat
                )
              );
              scrollToBottom('auto');
            },
            () => {
              setIsLoading(false);
              setIsStreaming(false);
            },
            abortControllerRef.current.signal
          );
        } else {
          await generateLLMResponse(
            message,
            chunk => {
              setChats(prev =>
                prev.map(chat =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: [
                          ...updatedMessages,
                          {
                            text: chunk,
                            isUser: false,
                            question: message,
                          },
                        ],
                      }
                    : chat
                )
              );
              scrollToBottom('auto');
            },
            () => {
              setIsLoading(false);
              setIsStreaming(false);
            },
            abortControllerRef.current.signal
          );
        }
      } catch (error) {
        console.error('Error handling message:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred';
        
        if (errorMessage !== 'Request aborted') {
          setChats(prev =>
            prev.map(chat =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: [
                      ...updatedMessages,
                      {
                        text: `Error: ${errorMessage}`,
                        isUser: false,
                      },
                    ],
                  }
                : chat
            )
          );
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    } catch (error) {
      console.error('Critical error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'A critical error occurred';
      
      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    text: `Critical Error: ${errorMessage}. Please try again.`,
                    isUser: false,
                  },
                ],
              }
            : chat
        )
      );
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleAPIConfirm = async (authToken?: string, modifiedConfig?: any) => {
    if (!pendingAPIConfig && !modifiedConfig) return;

    setIsLoading(true);
    try {
      const configToUse = modifiedConfig || {
        ...pendingAPIConfig,
        payload: pendingAPIConfig.method === 'GET' ? undefined : pendingAPIConfig.payload
      };

      console.log('Making API request with config:', configToUse);

      // Add streaming support for API calls
      const response = await triggerAPI(
        configToUse,
        authToken,
        (chunk) => {
          // Handle streaming updates
          if (pendingMessage) {
            setChats(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: [
                        ...chat.messages,
                        {
                          text: typeof chunk === 'string' ? chunk : JSON.stringify(chunk, null, 2),
                          isUser: false,
                          isStreaming: true
                        },
                      ],
                    }
                  : chat
              )
            );
            scrollToBottom('auto');
          }
        }
      );

      // Handle final response
      const formattedResponse = formatAPIResponse(response);

      if (pendingMessage) {
        setChats(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      text: formattedResponse,
                      isUser: false,
                      isStreaming: false
                    },
                  ],
                }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('API request error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to make API request';
      
      if (pendingMessage) {
        setChats(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { text: `Error: ${errorMessage}`, isUser: false },
                  ],
                }
              : chat
          )
        );
      }
    } finally {
      setIsLoading(false);
      setShowAPIDialog(false);
      setPendingAPIConfig(null);
      setPendingMessage(null);
    }
  };

  const handleClearChat = () => {
    // Clear conversation history if in Knowledge Base + AI mode
    if (aiModel === 'knowledge-ai') {
      clearConversationHistory();
    }

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [
                { text: 'Chat cleared. How can I help you?', isUser: false },
              ],
              isDraft: true,
              title: 'New Chat',
            }
          : chat
      )
    );
  };

  const handleImagePaste = async (file: File) => {
    try {
      const text = await extractTextFromImage(file);
      const formattedMessage = `## Extracted Text from Image\n\n${text}`;

      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (!currentChat) return '';

      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { text: formattedMessage, isUser: false },
                ],
                isDraft: false,
              }
            : chat
        )
      );

      return '';
    } catch (error) {
      console.error('Error extracting text from image:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to extract text from image';

      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    text: `Error: ${errorMessage}. Please try again with a different image.`,
                    isUser: false,
                  },
                ],
                isDraft: false,
              }
            : chat
        )
      );

      return '';
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      {isKnowledgeAIMode && (
        <div className="sticky top-0 z-10">
          <div className="absolute right-4 top-2 flex items-center gap-2 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 shadow-sm">
            {aiModel === 'knowledge-ai' ? (
              <div className="flex items-center gap-1.5">
                <TrainFront size={12} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="hidden sm:inline">Knowledge Base + AI Integration</span>
                    <span className="sm:hidden">KB + AI</span>
                  </span>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400 hidden sm:block">
                    Sensitive data will be masked; API questions will not be answered
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Cpu size={12} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="hidden sm:inline">Llama2 3.21B Model</span>
                    <span className="sm:hidden">Local LLM</span>
                  </span>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400 hidden sm:block">
                    Runs locally; No data sent to external services
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Area with improved scrolling */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="min-h-full flex flex-col">
          {chats.find(chat => chat.id === currentChatId)?.messages.map((message, index) => {
            const isLastMessage = index === chats.find(chat => chat.id === currentChatId)?.messages.length - 1;
            
            return (
              <div key={index}>
                {aiModel === 'knowledge' ? (
                  <KnowledgeBaseChat
                    message={message}
                    isStreaming={isStreaming}
                    isLastMessage={isLastMessage}
                    isLoading={isLoading}
                  />
                ) : aiModel === 'knowledge-ai' || aiModel === 'knowledge-ai-local' ? (
                  <KnowledgeAIChat
                    message={message}
                    isStreaming={isStreaming}
                    isLastMessage={isLastMessage}
                    isLoading={isLoading}
                  />
                ) : (
                  <AIAssistantChat
                    message={message}
                    isStreaming={isStreaming}
                    isLastMessage={isLastMessage}
                    isLoading={isLoading}
                  />
                )}
              </div>
            );
          })}
          
          {/* Invisible element to scroll to - this is the key fix */}
          <div ref={messagesEndRef} className="h-4 flex-shrink-0" />
        </div>
      </div>

      {/* Chat Input */}
      <div className="sticky bottom-0 left-0 right-0 flex-shrink-0 bg-white dark:bg-gray-900">
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          onImagePaste={handleImagePaste}
          onClear={handleClearChat}
          onSearch={handleSearch}
          isLoading={isLoading}
          aiModel={aiModel}
        />
      </div>

      {/* Hallucination Test Panel */}
      <HallucinationTestPanel
        onTestQuery={handleTestQuery}
        isVisible={showTestPanel}
        onToggle={() => setShowTestPanel(!showTestPanel)}
      />

      <APIConfirmDialog
        isOpen={showAPIDialog}
        config={pendingAPIConfig || { name: '', endpoint: '', method: 'GET' }}
        onConfirm={handleAPIConfirm}
        onCancel={() => {
          setShowAPIDialog(false);
          setPendingAPIConfig(null);
          setPendingMessage(null);
        }}
      />
    </div>
  );
}