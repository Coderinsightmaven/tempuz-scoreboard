import React, { useState, useEffect } from 'react';
import { TauriAPI, TauriScoreboardConfig } from '../../lib/tauri';

interface ScoreboardManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreboardManager: React.FC<ScoreboardManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [scoreboards, setScoreboards] = useState<TauriScoreboardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load scoreboards when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadScoreboards();
    }
  }, [isOpen]);

  const loadScoreboards = async () => {
    setIsLoading(true);
    try {
      const savedScoreboards = await TauriAPI.listScoreboards();
      console.log('📋 Loaded scoreboards:', savedScoreboards.map(sb => ({ 
        name: sb.name, 
        filename: sb.filename,
        id: sb.id 
      })));
      setScoreboards(savedScoreboards);
    } catch (error) {
      console.error('Failed to load scoreboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    console.log('🗑️ Attempting to delete scoreboard:', filename);
    
    try {
      await TauriAPI.deleteScoreboard(filename);
      console.log('✅ Successfully deleted:', filename);
      // Reload the list after deletion
      await loadScoreboards();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('❌ Failed to delete scoreboard:', error);
      
      // If file not found, it's a ghost entry - remove it from the UI
      if ((error as Error).toString().includes('Scoreboard file not found')) {
        console.log('🧹 Removing ghost scoreboard from UI list');
        // Filter out the ghost entry from the current list
        setScoreboards(prevScoreboards => 
          prevScoreboards.filter(sb => sb.filename !== filename)
        );
        setDeleteConfirm(null);
      } else {
        alert('Failed to delete scoreboard. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getComponentCount = (scoreboard: TauriScoreboardConfig) => {
    try {
      return scoreboard.data?.components?.length || 0;
    } catch {
      return 0;
    }
  };

  const getDimensions = (scoreboard: TauriScoreboardConfig) => {
    try {
      const dimensions = scoreboard.data?.dimensions;
      if (dimensions?.width && dimensions?.height) {
        return `${dimensions.width}×${dimensions.height}`;
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Scoreboards
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading scoreboards...</div>
            </div>
          ) : scoreboards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400 mb-2">No saved scoreboards found</div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create a scoreboard first, then save it to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scoreboards.map((scoreboard) => (
                <div
                  key={scoreboard.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {scoreboard.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Dimensions:</span>
                          <br />
                          {getDimensions(scoreboard)}
                        </div>
                        
                        <div>
                          <span className="font-medium">Components:</span>
                          <br />
                          {getComponentCount(scoreboard)}
                        </div>
                        
                        <div>
                          <span className="font-medium">Created:</span>
                          <br />
                          {formatDate(scoreboard.created_at)}
                        </div>
                        
                        <div>
                          <span className="font-medium">Updated:</span>
                          <br />
                          {formatDate(scoreboard.updated_at)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {deleteConfirm === scoreboard.filename ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Delete "{scoreboard.name}"?
                          </span>
                          <button
                            onClick={() => handleDelete(scoreboard.filename)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(scoreboard.filename)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                console.log('🔄 Force refreshing scoreboard list...');
                await loadScoreboards();
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
            >
              🔄 Force Refresh
            </button>
            
            <button
              onClick={async () => {
                console.log('🧹 Cleaning up ghost entries...');
                const cleanScoreboards = [];
                
                for (const scoreboard of scoreboards) {
                  try {
                    // Try to load each scoreboard to verify it exists
                    await TauriAPI.loadScoreboard(scoreboard.filename);
                    cleanScoreboards.push(scoreboard);
                    console.log('✅ Verified exists:', scoreboard.filename);
                  } catch (error) {
                    console.log('🗑️ Removing ghost entry:', scoreboard.filename, error);
                  }
                }
                
                setScoreboards(cleanScoreboards);
                console.log(`🧹 Cleanup complete. Removed ${scoreboards.length - cleanScoreboards.length} ghost entries`);
                
                if (scoreboards.length !== cleanScoreboards.length) {
                  alert(`Removed ${scoreboards.length - cleanScoreboards.length} ghost scoreboards that don't exist as files.`);
                }
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors text-sm"
            >
              🧹 Clean Up Ghosts
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};