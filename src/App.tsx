import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ChatPage } from './pages/ChatPage';
import { Documentation } from './pages/Documentation';
import { LoginPage } from './components/LoginPage';
import QAManagementModal from './components/QAManagementModal';
import { User } from './types/qa';
import { StorageType } from './utils/storage/types';
import { storageManager } from './utils/storage/storageManager';

interface Chat {
  id: string;
  title: string;
  messages: Array<{ text: string; isUser: boolean }>;
  createdAt: Date;
  isDraft: boolean;
}

export default function App() {
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'default',
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      isDraft: true
    }
  ]);
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [aiModel, setAiModel] = useState<'knowledge' | 'ai' | 'knowledge-ai'>('knowledge');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [entries, setEntries] = useState([]);
  const [storageType, setStorageType] = useState<StorageType>(
    storageManager.getConfig().type
  );
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  // Create user identifier from username and email
  const getUserIdentifier = (user: User): string => {
    return `${user.username}:${user.email}`;
  };

  // Initialize storage manager
  useEffect(() => {
    const initStorage = async () => {
      await storageManager.initialize();
      setStorageType(storageManager.getConfig().type);
    };
    initStorage();
  }, []);

  // Load entries when user changes or storage type changes
  useEffect(() => {
    if (currentUser) {
      const loadEntries = async () => {
        try {
          const provider = storageManager.getCurrentProvider();
          const userIdentifier = getUserIdentifier(currentUser);
          const loadedEntries = await provider.loadEntries(userIdentifier);
          setEntries(loadedEntries);
        } catch (error) {
          console.error('Error loading entries:', error);
        }
      };
      loadEntries();
    } else {
      setEntries([]);
    }
  }, [currentUser, storageType]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('user', JSON.stringify(user));
    
    // Load user's entries after login
    const loadEntries = async () => {
      const provider = storageManager.getCurrentProvider();
      const userIdentifier = getUserIdentifier(user);
      const loadedEntries = await provider.loadEntries(userIdentifier);
      setEntries(loadedEntries);
    };
    loadEntries();
    
    // Reset chat state
    setChats([{
      id: 'default',
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      isDraft: true
    }]);
    setCurrentChatId('default');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setCurrentUser(null);
    setEntries([]);
    setChats([{
      id: 'default',
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      isDraft: true
    }]);
    setCurrentChatId('default');
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      isDraft: true
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleStorageChange = async (type: StorageType) => {
    try {
      await storageManager.setProvider(type);
      setStorageType(type);
      if (currentUser) {
        const provider = storageManager.getCurrentProvider();
        const userIdentifier = getUserIdentifier(currentUser);
        const loadedEntries = await provider.loadEntries(userIdentifier);
        setEntries(loadedEntries);
      }
    } catch (error) {
      console.error('Error changing storage provider:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Implementation of message sending logic
    console.log('Sending message:', message);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={
          <MainLayout
            currentUser={currentUser}
            onLogout={handleLogout}
            aiModel={aiModel}
            setAiModel={setAiModel}
            onOpenQA={() => setIsQAModalOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            chats={chats}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={setCurrentChatId}
            onDeleteChat={(id) => {
              setChats(prev => prev.filter(chat => chat.id !== id));
              if (currentChatId === id) {
                setCurrentChatId('default');
              }
            }}
            storageType={storageType}
            onStorageChange={handleStorageChange}
            streamingEnabled={streamingEnabled}
            setStreamingEnabled={setStreamingEnabled}
          >
            <ChatPage
              chats={chats}
              currentChatId={currentChatId}
              setChats={setChats}
              aiModel={aiModel}
              storageType={storageType}
              streamingEnabled={streamingEnabled}
            />
          </MainLayout>
        } />
        <Route path="/docs" element={<Documentation />} />
      </Routes>

      <QAManagementModal
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        onSave={(entry) => {
          const loadEntries = async () => {
            const provider = storageManager.getCurrentProvider();
            const userIdentifier = currentUser ? getUserIdentifier(currentUser) : undefined;
            const updatedEntries = await provider.loadEntries(userIdentifier);
            setEntries(updatedEntries);
          };
          loadEntries();
        }}
        currentUser={currentUser}
        entries={entries}
        setEntries={setEntries}
        getUserIdentifier={getUserIdentifier}
      />
    </>
  );
}