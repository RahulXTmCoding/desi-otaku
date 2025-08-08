import React from 'react';
import { useDevMode } from '../context/DevModeContext';
import { Database, TestTube } from 'lucide-react';

const DevModeToggle: React.FC = () => {
  const { isTestMode, toggleTestMode } = useDevMode();

  // Only show in development mode - use multiple checks to ensure it's hidden in production
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return null;
  }

  // Additional check - if we're not in development, don't show
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Data Mode:</span>
          <button
            onClick={toggleTestMode}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              isTestMode ? 'bg-yellow-400' : 'bg-green-500'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isTestMode ? 'translate-x-1' : 'translate-x-9'
              }`}
            />
            <span className="absolute left-1.5 text-gray-900">
              <TestTube className="w-4 h-4" />
            </span>
            <span className="absolute right-1.5 text-gray-900">
              <Database className="w-4 h-4" />
            </span>
          </button>
          <span className={`text-sm font-medium ${isTestMode ? 'text-yellow-400' : 'text-green-400'}`}>
            {isTestMode ? 'Test Data' : 'Backend'}
          </span>
        </div>
        {!isTestMode && (
          <p className="text-xs text-gray-500 mt-2">
            Make sure backend is running
          </p>
        )}
      </div>
    </div>
  );
};

export default DevModeToggle;
