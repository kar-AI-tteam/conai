import React from 'react';
import { ArrowLeft, Brain, Bot, Image as ImageIcon, BookOpen, Code2, Sparkles, Database, Webhook, TableProperties, Search, Zap, Gauge, Shield, Eye, History, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Documentation() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Chat</span>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Contour AI Documentation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Getting Started with Contour AI</h1>
          <p>
            Contour AI is an intelligent chat interface powered by both a knowledge base and AI capabilities. 
            It helps you manage, access, and interact with your knowledge base content while providing 
            flexible AI assistance when needed.
          </p>

          <h2 className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Chat Modes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose mb-8">
            <div className="p-4 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-medium text-blue-900 dark:text-blue-100 m-0">Knowledge Base Mode</h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 m-0">
                Fast, precise answers from your curated knowledge base with relevance scoring and match highlighting.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-medium text-purple-900 dark:text-purple-100 m-0">Knowledge Base + AI</h3>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200 m-0">
                Combines knowledge base matches with AI synthesis and maintains conversation context for follow-up questions.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-medium text-indigo-900 dark:text-indigo-100 m-0">AI Assistant Mode</h3>
              </div>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 m-0">
                Pure AI-powered responses for general questions using OpenAI's GPT model.
              </p>
            </div>
          </div>

          <h2>Best Practices</h2>
          <ul>
            <li>Add relevant keywords to improve search accuracy</li>
            <li>Use descriptive questions for knowledge base entries</li>
            <li>Structure API configurations with proper authentication</li>
            <li>Regularly backup your knowledge base using the export feature</li>
            <li>Utilize markdown formatting for better content presentation</li>
            <li>Choose the appropriate chat mode based on your needs:
              <ul>
                <li>Knowledge Base: For precise, curated answers</li>
                <li>Knowledge Base + AI: For context-aware responses and follow-up questions</li>
                <li>AI Assistant: For general questions outside the knowledge base</li>
              </ul>
            </li>
          </ul>

          <h2 className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quick Commands
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose mb-8">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-base font-medium m-0">Clear Memory</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Type "clear memory" to reset conversation history in Knowledge Base + AI mode
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-base font-medium m-0">Format JSON</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Type "format json" followed by JSON content to format and validate
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-base font-medium m-0">Image Text</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Paste images (⌘V / Ctrl+V) to extract and process text content
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}