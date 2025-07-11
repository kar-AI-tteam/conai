import React from 'react';
import { Menu, X, Settings, FileJson } from 'lucide-react';

interface TopNavProps {
  onOpenQA: () => void;
  onOpenSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenQA, onOpenSettings }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#EFEFEF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <FileJson size={24} className="text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                API Q&A
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenQA}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Q&A
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
