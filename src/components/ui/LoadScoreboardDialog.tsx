import React, { useState, useEffect } from 'react';
import { TauriAPI, TauriScoreboardConfig } from '../../lib/tauri';
import { useScoreboardStore } from '../../stores/useScoreboardStore';
import { useCanvasStore } from '../../stores/useCanvasStore';

interface LoadScoreboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoadScoreboardDialog: React.FC<LoadScoreboardDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [savedScoreboards, setSavedScoreboards] = useState<TauriScoreboardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScoreboardId, setSelectedScoreboardId] = useState<string>('');
  
  const { loadScoreboard } = useScoreboardStore();
  const { setCanvasSize } = useCanvasStore();

  useEffect(() => {
    if (isOpen) {
      loadSavedScoreboards();
    }
  }, [isOpen]);

  const loadSavedScoreboards = async () => {
    setIsLoading(true);
    try {
      const scoreboards = await TauriAPI.listScoreboards();
      setSavedScoreboards(scoreboards);
    } catch (error) {
      console.error('Failed to load saved scoreboards:', error);
      alert('Failed to load saved scoreboards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadScoreboard = async () => {
    if (!selectedScoreboardId) {
      alert('Please select a scoreboard to load');
      return;
    }

    const selectedScoreboard = savedScoreboards.find(sb => sb.id === selectedScoreboardId);
    if (!selectedScoreboard) {
      alert('Selected scoreboard not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Load the full scoreboard data using the filename
      const scoreboardData = await TauriAPI.loadScoreboard(selectedScoreboard.filename);
      
      // Apply the loaded configuration to the store
      loadScoreboard(scoreboardData.data);
      
      // Update canvas size to match the loaded scoreboard
      if (scoreboardData.data.dimensions) {
        setCanvasSize(scoreboardData.data.dimensions.width, scoreboardData.data.dimensions.height);
      }
      
      onClose();
      alert(`Scoreboard "${scoreboardData.data.name}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
      alert('Failed to load scoreboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Load Scoreboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading scoreboards...</div>
            </div>
          ) : savedScoreboards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                No saved scoreboards found
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create and save a scoreboard design to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Select a scoreboard to load:
              </h3>
              
              {savedScoreboards.map((scoreboard) => (
                <div
                  key={scoreboard.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedScoreboardId === scoreboard.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedScoreboardId(scoreboard.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {scoreboard.data?.name || scoreboard.name}
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>
                          {scoreboard.data?.dimensions 
                            ? `${scoreboard.data.dimensions.width}×${scoreboard.data.dimensions.height}`
                            : 'Unknown size'
                          }
                        </span>
                        <span className="mx-2">•</span>
                        <span>{scoreboard.data?.sport || 'Unknown sport'}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {scoreboard.data?.components?.length || 0} components
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Created: {formatDate(scoreboard.created_at)}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <input
                        type="radio"
                        name="scoreboard"
                        checked={selectedScoreboardId === scoreboard.id}
                        onChange={() => setSelectedScoreboardId(scoreboard.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleLoadScoreboard}
            disabled={!selectedScoreboardId || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load Scoreboard'}
          </button>
        </div>
      </div>
    </div>
  );
};