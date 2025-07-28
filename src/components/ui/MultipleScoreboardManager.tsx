import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { ScoreboardInstance } from '../../types/scoreboard';
import { TauriAPI, TauriScoreboardConfig } from '../../lib/tauri';

interface MultipleScoreboardManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultipleScoreboardManager: React.FC<MultipleScoreboardManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    scoreboardInstances,
    selectedMonitor,
    createScoreboardInstance,
    closeScoreboardInstance,
    closeAllScoreboardInstances,
    updateScoreboardInstancePosition,
    updateScoreboardInstanceSize,
    lastError,
    isCreatingScoreboardWindow,
  } = useAppStore();

  const [newScoreboardName, setNewScoreboardName] = useState('');
  const [newScoreboardWidth, setNewScoreboardWidth] = useState(800);
  const [newScoreboardHeight, setNewScoreboardHeight] = useState(600);
  const [newOffsetX, setNewOffsetX] = useState(0);
  const [newOffsetY, setNewOffsetY] = useState(0);
  const [savedScoreboards, setSavedScoreboards] = useState<TauriScoreboardConfig[]>([]);
  const [selectedScoreboardId, setSelectedScoreboardId] = useState<string>('');
  const [isLoadingScoreboards, setIsLoadingScoreboards] = useState(false);
  const [createFromSaved, setCreateFromSaved] = useState(false);

  // Load saved scoreboards when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSavedScoreboards();
    }
  }, [isOpen]);

  const loadSavedScoreboards = async () => {
    setIsLoadingScoreboards(true);
    try {
      const scoreboards = await TauriAPI.listScoreboards();
      setSavedScoreboards(scoreboards);
    } catch (error) {
      console.error('Failed to load saved scoreboards:', error);
    } finally {
      setIsLoadingScoreboards(false);
    }
  };

  const handleCreateScoreboard = async () => {
    if (createFromSaved) {
      if (!selectedScoreboardId) {
        alert('Please select a saved scoreboard design');
        return;
      }
      
      const selectedScoreboard = savedScoreboards.find(sb => sb.id === selectedScoreboardId);
      if (!selectedScoreboard) {
        alert('Selected scoreboard not found');
        return;
      }

      const instanceId = await createScoreboardInstance(
        selectedScoreboard.name,
        newScoreboardWidth,
        newScoreboardHeight,
        newOffsetX,
        newOffsetY,
        selectedScoreboardId
      );

      if (instanceId) {
        // Reset form
        setSelectedScoreboardId('');
        setNewOffsetX(0);
        setNewOffsetY(0);
        setCreateFromSaved(false);
      }
    } else {
      if (!newScoreboardName.trim()) {
        alert('Please enter a name for the scoreboard');
        return;
      }

      const instanceId = await createScoreboardInstance(
        newScoreboardName,
        newScoreboardWidth,
        newScoreboardHeight,
        newOffsetX,
        newOffsetY
      );

      if (instanceId) {
        setNewScoreboardName('');
        setNewOffsetX(0);
        setNewOffsetY(0);
      }
    }
  };

  const handlePositionChange = async (instance: ScoreboardInstance, offsetX: number, offsetY: number) => {
    await updateScoreboardInstancePosition(instance.id, offsetX, offsetY);
  };

  const handleSizeChange = async (instance: ScoreboardInstance, width: number, height: number) => {
    await updateScoreboardInstanceSize(instance.id, width, height);
  };

  const getSelectedScoreboardDimensions = () => {
    if (!selectedScoreboardId) return { width: 800, height: 600 };
    
    const selectedScoreboard = savedScoreboards.find(sb => sb.id === selectedScoreboardId);
    if (!selectedScoreboard?.data?.dimensions) return { width: 800, height: 600 };
    
    return {
      width: selectedScoreboard.data.dimensions.width || 800,
      height: selectedScoreboard.data.dimensions.height || 600
    };
  };

  // Update dimensions when a saved scoreboard is selected
  useEffect(() => {
    if (createFromSaved && selectedScoreboardId) {
      const dimensions = getSelectedScoreboardDimensions();
      setNewScoreboardWidth(dimensions.width);
      setNewScoreboardHeight(dimensions.height);
    }
  }, [selectedScoreboardId, createFromSaved]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Multiple Scoreboard Manager
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

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Monitor Selection Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Selected Monitor
            </h3>
            {selectedMonitor ? (
              <p className="text-sm text-blue-700 dark:text-blue-200">
                {selectedMonitor.name} ({selectedMonitor.width}x{selectedMonitor.height}) at ({selectedMonitor.x}, {selectedMonitor.y})
              </p>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                No monitor selected. Please select a monitor first.
              </p>
            )}
          </div>

          {/* Create New Scoreboard */}
          <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Scoreboard Display
            </h3>
            
            {/* Toggle between new and saved */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scoreboardType"
                    checked={!createFromSaved}
                    onChange={() => setCreateFromSaved(false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Create blank scoreboard</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scoreboardType"
                    checked={createFromSaved}
                    onChange={() => setCreateFromSaved(true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use saved design</span>
                </label>
              </div>
            </div>

            {createFromSaved ? (
              /* Saved Scoreboard Selection */
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Saved Scoreboard
                </label>
                {isLoadingScoreboards ? (
                  <p className="text-sm text-gray-500">Loading saved scoreboards...</p>
                ) : savedScoreboards.length === 0 ? (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    No saved scoreboards found. Create and save a scoreboard design first.
                  </p>
                ) : (
                  <select
                    value={selectedScoreboardId}
                    onChange={(e) => setSelectedScoreboardId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a saved scoreboard...</option>
                    {savedScoreboards.map((scoreboard) => (
                      <option key={scoreboard.id} value={scoreboard.id}>
                        {scoreboard.name} - {new Date(scoreboard.updated_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
                {selectedScoreboardId && (
                  <button
                    onClick={loadSavedScoreboards}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Refresh List
                  </button>
                )}
              </div>
            ) : (
              /* New Scoreboard Name */
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newScoreboardName}
                  onChange={(e) => setNewScoreboardName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Scoreboard Display 1"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    value={newScoreboardWidth}
                    onChange={(e) => setNewScoreboardWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={createFromSaved}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    value={newScoreboardHeight}
                    onChange={(e) => setNewScoreboardHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={createFromSaved}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offset X (pixels)
                </label>
                <input
                  type="number"
                  value={newOffsetX}
                  onChange={(e) => setNewOffsetX(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offset Y (pixels)
                </label>
                <input
                  type="number"
                  value={newOffsetY}
                  onChange={(e) => setNewOffsetY(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={handleCreateScoreboard}
              disabled={!selectedMonitor || isCreatingScoreboardWindow || (createFromSaved && !selectedScoreboardId) || (!createFromSaved && !newScoreboardName.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isCreatingScoreboardWindow ? 'Creating...' : 'Create Scoreboard Display'}
            </button>
          </div>

          {/* Existing Scoreboards */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Active Scoreboards ({scoreboardInstances.length})
              </h3>
              {scoreboardInstances.length > 0 && (
                <button
                  onClick={closeAllScoreboardInstances}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md transition-colors text-sm"
                >
                  Close All
                </button>
              )}
            </div>

            {scoreboardInstances.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No scoreboards created yet. Create one above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {scoreboardInstances.map((instance) => (
                  <ScoreboardInstanceCard
                    key={instance.id}
                    instance={instance}
                    onClose={() => closeScoreboardInstance(instance.id)}
                    onPositionChange={(offsetX, offsetY) => handlePositionChange(instance, offsetX, offsetY)}
                    onSizeChange={(width, height) => handleSizeChange(instance, width, height)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{lastError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScoreboardInstanceCardProps {
  instance: ScoreboardInstance;
  onClose: () => void;
  onPositionChange: (offsetX: number, offsetY: number) => void;
  onSizeChange: (width: number, height: number) => void;
}

const ScoreboardInstanceCard: React.FC<ScoreboardInstanceCardProps> = ({
  instance,
  onClose,
  onPositionChange,
  onSizeChange,
}) => {
  const [offsetX, setOffsetX] = useState(instance.position.offsetX);
  const [offsetY, setOffsetY] = useState(instance.position.offsetY);
  const [width, setWidth] = useState(instance.size.width);
  const [height, setHeight] = useState(instance.size.height);

  const handlePositionUpdate = () => {
    onPositionChange(offsetX, offsetY);
  };

  const handleSizeUpdate = () => {
    onSizeChange(width, height);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{instance.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {instance.createdAt.toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Position Controls */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position Offset</h5>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              value={offsetX}
              onChange={(e) => setOffsetX(Number(e.target.value))}
              placeholder="Offset X"
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value))}
              placeholder="Offset Y"
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handlePositionUpdate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-2 rounded transition-colors"
          >
            Update Position
          </button>
        </div>

        {/* Size Controls */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size</h5>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              placeholder="Width"
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              placeholder="Height"
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSizeUpdate}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-2 rounded transition-colors"
          >
            Update Size
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Final Position: ({instance.position.x + instance.position.offsetX}, {instance.position.y + instance.position.offsetY}) | 
        Size: {instance.size.width}x{instance.size.height}
      </div>
    </div>
  );
}; 