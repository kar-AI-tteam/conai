import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { StorageType } from '../utils/storage/types';
import { PanelLeftOpen, Plus, Settings, MessageSquare } from 'lucide-react';

interface MainLayoutProps {
  currentUser: { username: string; email: string };
  onLogout: () => void;
  aiModel: 'knowledge' | 'ai' | 'knowledge-ai';
  setAiModel: (model: 'knowledge' | 'ai' | 'knowledge-ai') => void;
  onOpenQA: () => void;
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
  children: React.ReactNode;
  storageType: StorageType;
  onStorageChange: (type: StorageType) => void;
  streamingEnabled: boolean;
  setStreamingEnabled: (enabled: boolean) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onLogout,
  aiModel,
  setAiModel,
  onOpenQA,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  children,
  storageType,
  onStorageChange,
  streamingEnabled,
  setStreamingEnabled
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(!isSidebarCollapsed);

  // Update sidebar open state when collapsed state changes
  React.useEffect(() => {
    setIsSidebarOpen(!isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Handle sidebar toggle
  const handleSidebarToggle = (open: boolean) => {
    setIsSidebarOpen(open);
    setIsSidebarCollapsed(!open);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Fixed position with independent scrolling */}
      <div className={`${
        isSidebarOpen ? 'w-80' : 'w-12'
      } transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800 relative z-10`}>
        {isSidebarOpen ? (
          <div className="h-full w-80 flex flex-col overflow-hidden">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={handleSidebarToggle}
              isSidebarCollapsed={!isSidebarOpen}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              chats={chats}
              currentChatId={currentChatId}
              onNewChat={onNewChat}
              onSelectChat={onSelectChat}
              onDeleteChat={onDeleteChat}
              onOpenQA={onOpenQA}
              currentUser={currentUser}
            />
          </div>
        ) : (
          /* Collapsed Sidebar with All Controls as Icons */
          <div className="h-full w-12 flex flex-col items-center py-4 space-y-3 overflow-y-auto">
            {/* Expand Sidebar Button */}
            <button
              onClick={() => handleSidebarToggle(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>

            {/* Divider */}
            <div className="w-6 h-px bg-gray-300 dark:bg-gray-600"></div>

            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus size={20} />
            </button>

            {/* Recent Chats Indicator */}
            {chats.length > 0 && (
              <div className="flex flex-col items-center space-y-1">
                {chats.slice(0, 3).map((chat, index) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      chat.id === currentChatId
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title={chat.title}
                  >
                    <MessageSquare size={14} />
                  </button>
                ))}
                {chats.length > 3 && (
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                )}
              </div>
            )}

            {/* Spacer to push bottom controls down */}
            <div className="flex-1"></div>

            {/* Bottom Controls */}
            <div className="flex flex-col items-center space-y-3">
              {/* Knowledge Base Settings */}
              <button
                onClick={onOpenQA}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Knowledge Base"
              >
                <Settings size={20} />
              </button>

              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Independent scrolling */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <Header
            currentUser={currentUser}
            onLogout={onLogout}
            aiModel={aiModel}
            setAiModel={setAiModel}
            onOpenQA={onOpenQA}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={handleSidebarToggle}
            storageType={storageType}
            onStorageChange={onStorageChange}
            streamingEnabled={streamingEnabled}
            setStreamingEnabled={setStreamingEnabled}
          />
        </div>

        {/* Chat Area - Independent scrolling container */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          onClick={() => handleSidebarToggle(false)}
        />
      )}
    </div>
  );
};