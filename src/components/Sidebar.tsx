import React from 'react';
import { Brain, Plus, PanelLeftClose, Settings, MessageSquare, X } from 'lucide-react';
import { ChatHistory } from './ChatHistory';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  chats: Array<{
    id: string;
    title: string;
    messages: Array<{ text: string; isUser: boolean }>;
    createdAt: Date;
    isDraft: boolean;
  }>;
  currentChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenQA: () => void;
  currentUser: { username: string; email: string };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenQA,
  currentUser
}) => {
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setIsSidebarCollapsed(true);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Contour AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
          </div>
        </div>
        <button
          onClick={handleCloseSidebar}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat Button - Fixed */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New conversation
        </button>
      </div>

      {/* Chat History - Scrollable independently */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-1">
          <ChatHistory
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
            isSidebarOpen={true}
          />
        </div>
      </div>

      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenQA}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings size={16} />
          Knowledge Base
        </button>
      </div>
    </div>
  );
};