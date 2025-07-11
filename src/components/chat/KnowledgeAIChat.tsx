import React from 'react';
import { ChatMessage } from '../ChatMessage';

interface KnowledgeAIChatProps {
  message: {
    text: string;
    isUser: boolean;
    matchScore?: number;
    question?: string;
  };
  isStreaming?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

export const KnowledgeAIChat: React.FC<KnowledgeAIChatProps> = ({
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
      isAIMode={true}
      matchScore={message.matchScore}
      question={message.isUser ? undefined : message.question}
    />
  );
};