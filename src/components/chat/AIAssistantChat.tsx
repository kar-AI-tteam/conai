import React from 'react';
import { ChatMessage } from '../ChatMessage';

interface AIAssistantChatProps {
  message: {
    text: string;
    isUser: boolean;
    question?: string;
  };
  isStreaming?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
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
      question={message.isUser ? undefined : message.question}
    />
  );
};