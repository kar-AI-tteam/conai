import React from 'react';
import { ChatMessage } from '../ChatMessage';
import { QAItem } from '../../types/qa';

interface KnowledgeBaseChatProps {
  message: {
    text: string;
    isUser: boolean;
    matchScore?: number;
    question?: string;
    matches?: Array<{
      question: string;
      answer: string;
      score: number;
    }>;
  };
  isStreaming?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

export const KnowledgeBaseChat: React.FC<KnowledgeBaseChatProps> = ({
  message,
  isStreaming,
  isLastMessage,
  isLoading
}) => {
  return (
    <ChatMessage
      message={message.text}
      isUser={message.isUser}
      isStreaming={isStreaming && isLastMessage && isLoading}
      matches={message.matches}
      matchScore={message.matchScore}
      question={message.isUser ? undefined : message.question}
    />
  );
};