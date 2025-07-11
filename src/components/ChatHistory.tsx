import React from 'react';
import { MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  messages: Array<{ text: string; isUser: boolean }>;
  createdAt: Date;
  isDraft: boolean;
}

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isSidebarOpen: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  isSidebarOpen,
}) => {
  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`group relative rounded-lg transition-colors ${
            chat.id === currentChatId 
              ? 'bg-gray-200 dark:bg-gray-700' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <button
            onClick={() => onSelectChat(chat.id)}
            className="w-full text-left p-3 flex items-center gap-3"
          >
            <MessageSquare size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {chat.isDraft ? 'New conversation' : (chat.title.length > 30 ? chat.title.substring(0, 30) + '...' : chat.title)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {chat.createdAt.toLocaleDateString()}
              </div>
            </div>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(chat.id);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            title="Delete conversation"
          >
            <Trash2 size={14} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
          </button>
        </div>
      ))}
    </div>
  );
}