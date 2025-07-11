import React from 'react';
import { Check } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string | React.ReactNode;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled
}) => {
  return (
    <label className="inline-flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out
          ${checked ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-blue-400/50 dark:hover:ring-blue-500/50'}
          focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        `}
      >
        <span
          className={`
            ${checked ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white'}
            pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out
          `}
        >
          {checked && (
            <Check 
              size={10} 
              className="h-full w-full text-blue-500 p-0.5" 
              strokeWidth={4}
            />
          )}
        </span>
      </button>
      {label && (
        <span className={`text-sm ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </label>
  );
};