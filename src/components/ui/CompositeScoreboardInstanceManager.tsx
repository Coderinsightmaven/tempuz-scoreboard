import React, { useState, useEffect } from 'react';
import { TauriAPI } from '../../lib/tauri';

interface CompositeScoreboardInstance {
  windowId: string;
  name: string;
  isActive: boolean;
  isFullscreen?: boolean;
}

interface CompositeScoreboardInstanceManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompositeScoreboardInstanceManager: React.FC<CompositeScoreboardInstanceManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [instances, setInstances] = useState<CompositeScoreboardInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompositeInstances();
      // Refresh instances every 2 seconds while dialog is open
      const interval = setInterval(loadCompositeInstances, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadCompositeInstances = async () => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      const allWindows = await TauriAPI.listScoreboardWindows();
      const compositeWindows = allWindows.filter(windowId => 
        windowId.startsWith('composite_scoreboard_')
      );
      
      const compositeInstances: CompositeScoreboardInstance[] = compositeWindows.map(windowId => ({
        windowId,
        name: `Composite Scoreboard ${windowId.split('_').pop()}`,
        isActive: true,
        isFullscreen: true, // Composite scoreboards typically start fullscreen
      }));
      
      setInstances(compositeInstances);
    } catch (error) {
      console.error('Failed to load composite instances:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to load composite instances');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFullscreen = async (windowId: string) => {
    try {
      await TauriAPI.toggleScoreboardFullscreen(windowId);
      // Update the local state optimistically
      setInstances(prev => prev.map(instance => 
        instance.windowId === windowId 
          ? { ...instance, isFullscreen: !instance.isFullscreen }
          : instance
      ));
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      setLastError('Failed to toggle fullscreen');
    }
  };

  const handleSetFullscreen = async (windowId: string, fullscreen: boolean) => {
    try {
      await TauriAPI.setScoreboardFullscreen(windowId, fullscreen);
      // Update the local state
      setInstances(prev => prev.map(instance => 
        instance.windowId === windowId 
          ? { ...instance, isFullscreen: fullscreen }
          : instance
      ));
    } catch (error) {
      console.error('Failed to set fullscreen:', error);
      setLastError('Failed to set fullscreen mode');
    }
  };

  const handleCloseInstance = async (windowId: string) => {
    if (confirm('Are you sure you want to close this composite scoreboard?')) {
      try {
        await TauriAPI.closeScoreboardWindow(windowId);
        setInstances(prev => prev.filter(instance => instance.windowId !== windowId));
      } catch (error) {
        console.error('Failed to close instance:', error);
        setLastError('Failed to close composite scoreboard');
      }
    }
  };

  const handleCloseAll = async () => {
    if (confirm('Are you sure you want to close all composite scoreboards?')) {
      try {
        // Close all composite scoreboards
        await Promise.all(instances.map(instance => 
          TauriAPI.closeScoreboardWindow(instance.windowId)
        ));
        setInstances([]);
      } catch (error) {
        console.error('Failed to close all instances:', error);
        setLastError('Failed to close all composite scoreboards');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Composite Scoreboards ({instances.length})
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={loadCompositeInstances}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              {instances.length > 0 && (
                <button
                  onClick={handleCloseAll}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Close All
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Press F11 to exit fullscreen mode
            </div>
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-red-700 dark:text-red-300 text-sm">{lastError}</span>
                <button
                  onClick={() => setLastError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Instances List */}
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📺</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Composite Scoreboards Active
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create a composite scoreboard to manage multiple displays
              </p>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Composite Scoreboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <CompositeInstanceCard
                  key={instance.windowId}
                  instance={instance}
                  onToggleFullscreen={() => handleToggleFullscreen(instance.windowId)}
                  onSetFullscreen={(fullscreen) => handleSetFullscreen(instance.windowId, fullscreen)}
                  onClose={() => handleCloseInstance(instance.windowId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CompositeInstanceCardProps {
  instance: CompositeScoreboardInstance;
  onToggleFullscreen: () => void;
  onSetFullscreen: (fullscreen: boolean) => void;
  onClose: () => void;
}

const CompositeInstanceCard: React.FC<CompositeInstanceCardProps> = ({
  instance,
  onToggleFullscreen,
  onSetFullscreen,
  onClose,
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {instance.name}
            </h4>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
              COMPOSITE
            </span>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div>Window ID: <code className="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">{instance.windowId}</code></div>
            <div>Mode: <span className="font-medium">{instance.isFullscreen ? 'Fullscreen' : 'Windowed'}</span></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Windowed Mode Button */}
          <button
            onClick={() => onSetFullscreen(false)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              !instance.isFullscreen 
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            }`}
            title="Set to Windowed Mode"
          >
            Windowed
          </button>
          
          {/* Fullscreen Mode Button */}
          <button
            onClick={() => onSetFullscreen(true)}
            className="px-3 py-1 text-xs rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            title="Set to Fullscreen Mode"
          >
            Fullscreen
          </button>
          
          {/* Toggle Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Toggle Fullscreen Mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 01-2 2h-2" />
            </svg>
          </button>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
            title="Close Composite Scoreboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};