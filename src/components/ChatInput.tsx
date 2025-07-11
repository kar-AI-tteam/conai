import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Square, Image as ImageIcon, Code2, Trash2, Search, ArrowUp, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  onImagePaste?: (file: File) => Promise<string>;
  onClear?: () => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  aiModel?: 'knowledge' | 'ai' | 'knowledge-ai' | 'knowledge-ai-local';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  onImagePaste,
  onClear,
  onSearch,
  isLoading,
  aiModel
}) => {
  const [message, setMessage] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const trimmedMessage = message.trim();
      
      if (trimmedMessage.toLowerCase().startsWith('/search ')) {
        const searchQuery = trimmedMessage.substring(8).trim();
        if (searchQuery && onSearch) {
          onSearch(searchQuery);
          setMessage('');
          if (inputRef.current) {
            inputRef.current.style.height = 'auto';
          }
          return;
        }
      }
      
      if (
        trimmedMessage.toLowerCase() === 'clear' ||
        trimmedMessage.toLowerCase() === 'clr' ||
        trimmedMessage.toLowerCase() === 'cls'
      ) {
        onClear?.();
      } else {
        onSend(message);
      }
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    
    // Auto-resize textarea like Claude
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !onImagePaste) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setIsPasting(true);
            const result = await onImagePaste(file);
            if (result) {
              setMessage(result);
              if (inputRef.current) {
                inputRef.current.style.height = 'auto';
                const newHeight = Math.min(inputRef.current.scrollHeight, 200);
                inputRef.current.style.height = `${newHeight}px`;
              }
            }
          } catch (error) {
            console.error('Error handling image paste:', error);
          } finally {
            setIsPasting(false);
          }
        }
        break;
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && onImagePaste) {
      try {
        setIsPasting(true);
        const result = await onImagePaste(file);
        if (result) {
          setMessage(result);
          if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            const newHeight = Math.min(inputRef.current.scrollHeight, 200);
            inputRef.current.style.height = `${newHeight}px`;
          }
        }
      } catch (error) {
        console.error('Error handling image upload:', error);
      } finally {
        setIsPasting(false);
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors shadow-lg">
            {/* Attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Upload image"
            >
              <Paperclip size={20} />
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isPasting ? 'Processing image...' : 'Message Contour AI...'}
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-2 py-4 focus:outline-none resize-none min-h-[56px] max-h-[200px] text-base leading-6"
              rows={1}
              disabled={isLoading || isPasting}
              style={{ height: 'auto' }}
            />

            {/* Send/Stop button */}
            <div className="flex-shrink-0 p-3">
              {isPasting && (
                <div className="p-2 text-blue-500 dark:text-blue-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
              {isLoading && !isPasting && (
                <button
                  type="button"
                  onClick={onStop}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Stop generating"
                >
                  <Square size={20} />
                </button>
              )}
              {!isLoading && !isPasting && (
                <button
                  type="submit"
                  className={`p-2 rounded-lg transition-colors ${
                    message.trim()
                      ? 'text-white bg-blue-500 hover:bg-blue-600 shadow-md'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!message.trim()}
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Helper text */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Contour AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};