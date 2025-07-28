// src/components/ui/CreateScoreboardDialog.tsx
import React, { useState } from 'react';

interface CreateScoreboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateScoreboard: (name: string, width: number, height: number) => void;
}

export const CreateScoreboardDialog: React.FC<CreateScoreboardDialogProps> = ({
  isOpen,
  onClose,
  onCreateScoreboard,
}) => {
  const [name, setName] = useState('New Scoreboard');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  const presetSizes = [
    { name: '512x256 (Small)', width: 512, height: 256 },
    { name: '896x512 (Medium)', width: 896, height: 512 },
    { name: '1024x896 (Large)', width: 1024, height: 896 },
    { name: '800x600 (4:3)', width: 800, height: 600 },
    { name: '1920x1080 (Full HD)', width: 1920, height: 1080 },
    { name: '1366x768 (HD)', width: 1366, height: 768 },
    { name: '1280x720 (HD Ready)', width: 1280, height: 720 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && width > 0 && height > 0) {
      onCreateScoreboard(name.trim(), width, height);
      onClose();
    }
  };

  const handlePresetSelect = (preset: typeof presetSizes[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Scoreboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Scoreboard Name */}
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

          {/* Canvas Size Presets */}
          <div>
            <label className="form-label">Canvas Size Presets</label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {presetSizes.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-left px-3 py-2 text-sm rounded-md border transition-colors
                    ${width === preset.width && height === preset.height
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="100"
                max="7680"
                required
              />
            </div>
            <div>
              <label className="form-label">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="100"
                max="4320"
                required
              />
            </div>
          </div>

          {/* Aspect Ratio Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Aspect Ratio: {width && height ? (width / height).toFixed(2) : '—'} 
            {width === 1920 && height === 1080 && ' (16:9)'}
            {width === 1366 && height === 768 && ' (16:9)'}
            {width === 1280 && height === 720 && ' (16:9)'}
            {width === 2560 && height === 1440 && ' (16:9)'}
            {width === 3840 && height === 2160 && ' (16:9)'}
            {width === 800 && height === 600 && ' (4:3)'}
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
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                         border border-transparent rounded-md hover:bg-blue-700 
                         focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Create Scoreboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 