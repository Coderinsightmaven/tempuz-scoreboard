// src/components/ui/SaveScoreboardDialog.tsx
import React, { useState, useEffect } from 'react';

interface SaveScoreboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentName: string;
}

export const SaveScoreboardDialog: React.FC<SaveScoreboardDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
}) => {
  const [name, setName] = useState(currentName);

  // Update the name when currentName changes
  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  const handleKeepCurrentName = () => {
    onSave(currentName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Save Scoreboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Name Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Current name: <span className="font-medium text-gray-900 dark:text-white">{currentName}</span>
            </div>
          </div>

          {/* New Name Input */}
          <div>
            <label className="form-label">Scoreboard Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter scoreboard name"
              required
            />
          </div>

          {/* Save Options */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              💡 Save Options:
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Enter a new name to save as a different scoreboard</li>
              <li>• Keep the current name to overwrite the existing one</li>
              <li>• Scoreboards are saved locally on your device</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                         rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleKeepCurrentName}
              className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300
                         bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-600
                         rounded-md hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
            >
              Keep Current Name
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                         border border-transparent rounded-md hover:bg-blue-700
                         focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Save with New Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
