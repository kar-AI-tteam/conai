import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  User,
  BookOpenText,
  LogOut,
  Database,
  Sparkles,
  TrainFront,
  Cloud,
  Box,
  ChevronDown,
  ChevronRight,
  Cpu,
  Zap,
  PanelLeftOpen,
  Brain,
  Settings,
  Check,
  Info,
  ArrowRight,
  Shield
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { StorageType } from '../utils/storage/types';
import { Toggle } from './controls/Toggle';

interface HeaderProps {
  currentUser: { username: string; email: string };
  onLogout: () => void;
  aiModel: 'knowledge' | 'ai' | 'knowledge-ai' | 'knowledge-ai-local';
  setAiModel: (model: 'knowledge' | 'ai' | 'knowledge-ai' | 'knowledge-ai-local') => void;
  onOpenQA: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  storageType: StorageType;
  onStorageChange: (type: StorageType) => void;
  streamingEnabled: boolean;
  setStreamingEnabled: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  aiModel,
  setAiModel,
  onOpenQA,
  isSidebarOpen,
  setIsSidebarOpen,
  storageType,
  onStorageChange,
  streamingEnabled,
  setStreamingEnabled
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.username.toLowerCase() === 'docqadmin';
  const isKnowledgeAIMode = aiModel === 'knowledge-ai' || aiModel === 'knowledge-ai-local';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modelOptions = [
    {
      value: 'knowledge',
      label: 'Knowledge Base',
      description: 'Fast, precise answers from knowledge base',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    ...(isAdmin ? [
      {
        value: 'knowledge-ai' as const,
        label: 'Knowledge + AI',
        description: 'Knowledge base with AI enhancement',
        icon: TrainFront,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800'
      },
      {
        value: 'ai' as const,
        label: 'AI Assistant',
        description: 'Pure AI-powered responses',
        icon: Sparkles,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800'
      }
    ] : [])
  ];

  const currentModel = modelOptions.find(option => option.value === aiModel);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Model Selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 min-w-[220px] group"
          >
            {currentModel && (
              <>
                <div className={`p-1.5 rounded-lg ${currentModel.bgColor} ${currentModel.borderColor} border`}>
                  <currentModel.icon size={16} className={currentModel.color} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentModel.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentModel.description}
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </>
            )}
          </button>

          {showModelMenu && (
            <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl py-3 z-50 backdrop-blur-sm">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={16} className="text-blue-500 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Choose AI Model
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select how you want to interact with Contour AI
                </p>
              </div>
              
              {/* Model Options */}
              <div className="px-2 py-2">
                {modelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setAiModel(option.value);
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                      aiModel === option.value 
                        ? `${option.bgColor} ${option.borderColor} border` 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      aiModel === option.value 
                        ? 'bg-white dark:bg-gray-800 shadow-sm' 
                        : `${option.bgColor} ${option.borderColor} border`
                    }`}>
                      <option.icon size={18} className={option.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {option.label}
                        </span>
                        {aiModel === option.value && (
                          <div className="flex items-center gap-1">
                            <Check size={14} className="text-blue-500" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    <ArrowRight size={14} className={`transition-transform duration-200 ${
                      aiModel === option.value 
                        ? 'text-blue-500 transform translate-x-0.5' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                  </button>
                ))}
              </div>

              {/* Streaming Toggle for Knowledge Base Mode */}
              {aiModel === 'knowledge' && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className={streamingEnabled ? 'text-blue-500' : 'text-gray-400'} />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Streaming Responses
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enable real-time response streaming
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={streamingEnabled}
                      onChange={setStreamingEnabled}
                    />
                  </div>
                </div>
              )}

              {/* Footer Info */}
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Info size={12} />
                  <span>Switch between modes anytime to match your workflow</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenQA}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
          title="Knowledge Base"
        >
          <Settings size={20} />
        </button>

        <Link
          to="/docs"
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
          title="Documentation"
        >
          <BookOpenText size={20} />
        </Link>
        
        <Link
          to="/admin"
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
          title="Admin Dashboard"
        >
          <Shield size={20} />
        </Link>
        
        <ThemeSwitcher />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <User size={16} className="text-white" />
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl py-3 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {currentUser.username}
                      </p>
                      {isAdmin && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="py-2">
                <button
                  onClick={() => {
                    onLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};