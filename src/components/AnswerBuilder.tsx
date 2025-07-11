import React, { useState, useRef, useEffect } from 'react';
import {
  ListOrdered, Code2, Table, Quote, AlertTriangle, CheckCircle2, Info,
  Bold, Italic, Strikethrough, List, Link, Image as ImageIcon, Heading,
  CheckSquare, Code, ChevronDown, ChevronRight, FileBox, Braces,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Weight as LineHeight,
  Video, CodeSquare, Hash, FileImage, ListStart, Palette, Upload, File,
  ArrowDown, Maximize2, Minimize2
} from 'lucide-react';

interface AnswerBuilderProps {
  onInsert: (text: string) => void;
  value: string;
  onFileUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadError?: string | null;
  fileName?: string;
}

const TEXT_COLORS = [
  { name: 'Default', class: 'text-gray-900 dark:text-gray-100' },
  { name: 'Blue', class: 'text-blue-600 dark:text-blue-400' },
  { name: 'Green', class: 'text-green-600 dark:text-green-400' },
  { name: 'Red', class: 'text-red-600 dark:text-red-400' },
  { name: 'Purple', class: 'text-purple-600 dark:text-purple-400' },
  { name: 'Yellow', class: 'text-yellow-600 dark:text-yellow-400' },
  { name: 'Indigo', class: 'text-indigo-600 dark:text-indigo-400' }
];

const LINE_SPACING_OPTIONS = [
  { label: 'Single', value: 1 },
  { label: '1.15', value: 1.15 },
  { label: '1.5', value: 1.5 },
  { label: 'Double', value: 2 }
];

const FORMATTING_TOOLS = [
  { name: 'Bold', icon: Bold, action: 'bold' },
  { name: 'Italic', icon: Italic, action: 'italic' },
  { name: 'Strikethrough', icon: Strikethrough, action: 'strikethrough' },
  { name: 'Code', icon: Code, action: 'code' },
  { name: 'Color', icon: Palette, action: 'color' },
  { name: 'Link', icon: Link, action: 'link' },
  { name: 'Image', icon: FileImage, action: 'image' },
  { name: 'New Line', icon: ArrowDown, action: 'newLine' }
];

const HEADING_TOOLS = [
  { name: 'Heading 1', icon: Hash, action: 'h1' },
  { name: 'Heading 2', icon: Hash, action: 'h2' },
  { name: 'Heading 3', icon: Hash, action: 'h3' }
];

const ALIGNMENT_TOOLS = [
  { name: 'Align Left', icon: AlignLeft, action: 'alignLeft' },
  { name: 'Align Center', icon: AlignCenter, action: 'alignCenter' },
  { name: 'Align Right', icon: AlignRight, action: 'alignRight' },
  { name: 'Justify', icon: AlignJustify, action: 'justify' },
  { name: 'Line Spacing', icon: LineHeight, action: 'lineSpacing' }
];

const LIST_TOOLS = [
  { name: 'Bullet List', icon: List, action: 'bullet' },
  { name: 'Numbered List', icon: ListStart, action: 'numbered' },
  { name: 'Task List', icon: CheckSquare, action: 'task' }
];

const MEDIA_TOOLS = [
  { name: 'Table', icon: Table, action: 'table' },
  { name: 'Video', icon: Video, action: 'video' },
  { name: 'Embed Code', icon: CodeSquare, action: 'embed' }
];

const CALLOUT_TOOLS = [
  { name: 'Note', icon: Info, action: 'note' },
  { name: 'Warning', icon: AlertTriangle, action: 'warning' },
  { name: 'Success', icon: CheckCircle2, action: 'success' }
];

const TEMPLATES = [
  {
    name: 'API Reference',
    icon: Braces,
    content: '# API Reference\n\n## Endpoint\n\n```\nPOST /api/v1/resource\n```\n\n## Request\n\n```json\n{\n  "key": "value"\n}\n```'
  },
  {
    name: 'Code Guide',
    icon: Code2,
    content: '# Code Guide\n\n## Overview\n\nExplanation of the code and its purpose.\n\n## Examples\n\n```javascript\n// Example code\n```'
  }
];

export const AnswerBuilder: React.FC<AnswerBuilderProps> = ({
  onInsert,
  value,
  onFileUpload,
  isUploading,
  uploadError,
  fileName
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
      const newHeight = Math.min(textareaRef.current.scrollHeight, isMaximized ? window.innerHeight * 0.8 : 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value, isMaximized]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (lineSpacingRef.current && !lineSpacingRef.current.contains(event.target as Node)) {
        setShowLineSpacing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeSelection = textarea.value.substring(0, start);
    const afterSelection = textarea.value.substring(end);

    let newText = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bullet':
        if (selectedText) {
          newText = selectedText
            .split('\n')
            .map(line => line.trim() ? `- ${line}` : '')
            .join('\n');
          cursorOffset = newText.length;
        } else {
          const lastChar = start > 0 ? textarea.value.charAt(start - 1) : '';
          const needsNewline = lastChar && lastChar !== '\n';
          newText = `${needsNewline ? '\n' : ''}- `;
          cursorOffset = newText.length;
        }
        break;
      case 'numbered':
        if (selectedText) {
          newText = selectedText
            .split('\n')
            .map((line, i) => line.trim() ? `${i + 1}. ${line}` : '')
            .join('\n');
          cursorOffset = newText.length;
        } else {
          const lastChar = start > 0 ? textarea.value.charAt(start - 1) : '';
          const needsNewline = lastChar && lastChar !== '\n';
          newText = `${needsNewline ? '\n' : ''}1. `;
          cursorOffset = newText.length;
        }
        break;
      case 'task':
        if (selectedText) {
          newText = selectedText
            .split('\n')
            .map(line => line.trim() ? `- [ ] ${line}` : '')
            .join('\n');
          cursorOffset = newText.length;
        } else {
          const lastChar = start > 0 ? textarea.value.charAt(start - 1) : '';
          const needsNewline = lastChar && lastChar !== '\n';
          newText = `${needsNewline ? '\n' : ''}- [ ] `;
          cursorOffset = newText.length;
        }
        break;
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `_${selectedText || 'italic text'}_`;
        break;
      case 'strikethrough':
        newText = `~~${selectedText || 'strikethrough text'}~~`;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        newText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        break;
      case 'video':
        newText = `<video src="video-url" controls>\n  Your browser does not support the video tag.\n</video>`;
        break;
      case 'embed':
        newText = `<iframe src="embed-url" frameborder="0" allowfullscreen></iframe>`;
        break;
      case 'h1':
        newText = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        newText = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'h3':
        newText = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'table':
        newText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`;
        break;
      case 'quote':
        newText = `> ${selectedText || 'Quote text'}`;
        break;
      case 'note':
        newText = `> **Note**\n> ${selectedText || 'Important information'}`;
        break;
      case 'warning':
        newText = `> **Warning**\n> ${selectedText || 'Warning message'}`;
        break;
      case 'success':
        newText = `> **Success**\n> ${selectedText || 'Success message'}`;
        break;
      case 'alignLeft':
        newText = `<div style="text-align: left">${selectedText || 'Left aligned text'}</div>`;
        break;
      case 'alignCenter':
        newText = `<div style="text-align: center">${selectedText || 'Centered text'}</div>`;
        break;
      case 'alignRight':
        newText = `<div style="text-align: right">${selectedText || 'Right aligned text'}</div>`;
        break;
      case 'justify':
        newText = `<div style="text-align: justify">${selectedText || 'Justified text'}</div>`;
        break;
      case 'newLine':
        newText = '\n';
        break;
      default:
        newText = selectedText;
        cursorOffset = newText.length;
    }

    const updatedValue = beforeSelection + newText + afterSelection;
    onInsert(updatedValue);
    
    requestAnimationFrame(() => {
      textarea.focus();
      const newPosition = start + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight || '20');
      const currentLine = textarea.value.substr(0, newPosition).split('\n').length;
      const scrollTop = (currentLine - 1) * lineHeight;
      textarea.scrollTop = scrollTop;
    });
  };

  const handleColorClick = (colorClass: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = `<span class="${colorClass}">${selectedText || 'colored text'}</span>`;
    
    const updatedValue = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    onInsert(updatedValue);
    
    textarea.focus();
    const newPosition = start + newText.length;
    textarea.setSelectionRange(newPosition, newPosition);
    setShowColorPicker(false);
  };

  const handleLineSpacingClick = (spacing: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = `<div style="line-height: ${spacing}">${selectedText || 'Text with custom line spacing'}</div>`;
    
    const updatedValue = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    onInsert(updatedValue);
    
    textarea.focus();
    const newPosition = start + newText.length;
    textarea.setSelectionRange(newPosition, newPosition);
    setShowLineSpacing(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const value = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === 'insertLineBreak') {
      const lines = value.split('\n');
      const currentLineIndex = value.substr(0, cursorPosition).split('\n').length - 1;
      const currentLine = lines[currentLineIndex - 1] || '';
      
      if (currentLine.match(/^[-*\d.]\s+$/) || currentLine.match(/^-\s*\[\s*\]\s*$/)) {
        const newValue = value.substring(0, cursorPosition - currentLine.length - 1) + 
                        value.substring(cursorPosition);
        onInsert(newValue);
        return;
      }
      
      if (currentLine.startsWith('- [ ]')) {
        handleAction('task');
        return;
      } else if (currentLine.startsWith('-') || currentLine.startsWith('*')) {
        handleAction('bullet');
        return;
      } else if (currentLine.match(/^\d+\./)) {
        handleAction('numbered');
        return;
      }
    }
    
    onInsert(value);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (textareaRef.current) {
      textareaRef.current.style.height = isMaximized ? '200px' : 'calc(80vh - 200px)';
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {FORMATTING_TOOLS.map(tool => (
            <div key={tool.name} className="relative">
              <button
                onClick={() => tool.action === 'color' ? setShowColorPicker(!showColorPicker) : handleAction(tool.action)}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={tool.name}
              >
                <tool.icon size={16} />
              </button>
              {tool.action === 'color' && showColorPicker && (
                <div ref={colorPickerRef} className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
                  {TEXT_COLORS.map(color => (
                    <div
                      key={color.name}
                      onClick={() => handleColorClick(color.class)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full ${color.class} border border-gray-200 dark:border-gray-700`} />
                      <span className="text-sm">{color.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          {HEADING_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => handleAction(tool.action)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={tool.name}
            >
              <tool.icon size={tool.action === 'h1' ? 18 : tool.action === 'h2' ? 16 : 14} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          {ALIGNMENT_TOOLS.map(tool => (
            <div key={tool.name} className="relative">
              <button
                onClick={() => tool.action === 'lineSpacing' ? setShowLineSpacing(!showLineSpacing) : handleAction(tool.action)}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={tool.name}
              >
                <tool.icon size={16} />
              </button>
              {tool.action === 'lineSpacing' && showLineSpacing && (
                <div ref={lineSpacingRef} className="absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
                  {LINE_SPACING_OPTIONS.map(option => (
                    <div
                      key={option.value}
                      onClick={() => handleLineSpacingClick(option.value)}
                      className="w-full px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          {LIST_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => handleAction(tool.action)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={tool.name}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          {MEDIA_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => handleAction(tool.action)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={tool.name}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          {CALLOUT_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => handleAction(tool.action)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={tool.name}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Templates"
            >
              <FileBox size={16} />
            </button>
            {showTemplates && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
                {TEMPLATES.map(template => (
                  <div
                    key={template.name}
                    onClick={() => {
                      onInsert(template.content);
                      setShowTemplates(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <template.icon size={14} className="text-gray-400" />
                    <span className="text-sm">{template.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onFileUpload && (
          <>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onFileUpload) {
                    onFileUpload(file);
                  }
                }}
                accept=".txt,.doc,.docx,.pdf,.json,.xml"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                title="Upload Document"
              >
                {isUploading ? (
                  <>
                    <File className="h-4 w-4 animate-pulse" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </>
                )}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fileName || 'TXT, DOC, DOCX, PDF, JSON, XML'}
              </span>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3">
          <AlertTriangle size={16} />
          {uploadError}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono resize-y transition-all duration-200 ${
            isMaximized ? 'min-h-[calc(80vh-200px)]' : 'min-h-[200px]'
          }`}
          style={{
            direction: 'ltr',
            unicodeBidi: 'normal',
            textAlign: 'left'
          }}
          placeholder="Type your answer here... Use markdown for formatting."
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          onClick={toggleMaximize}
          className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isMaximized ? "Minimize editor" : "Maximize editor"}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};