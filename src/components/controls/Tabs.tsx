import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'solid';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills'
}) => {
  const getTabStyles = (isActive: boolean) => {
    const baseStyles = "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors";
    
    switch (variant) {
      case 'pills':
        return `${baseStyles} rounded-lg ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`;
      case 'underline':
        return `${baseStyles} border-b-2 ${
          isActive
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        }`;
      case 'solid':
        return `${baseStyles} ${
          isActive
            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        }`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className={`flex gap-1 ${variant === 'solid' ? 'bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg' : ''}`}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={getTabStyles(isActive)}
          >
            {Icon && <Icon size={16} className="flex-shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};