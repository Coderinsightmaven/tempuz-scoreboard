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
    monitors,
    scoreboardInstances,
    selectedMonitor,
    createScoreboardInstance,
    closeScoreboardInstance,
    closeAllScoreboardInstances,
    updateScoreboardInstancePosition,
    updateScoreboardInstanceSize,
    selectMonitor,
    loadMonitors,
    isLoadingMonitors,
    lastError,
    isCreatingScoreboardWindow,
  } = useAppStore();

  const [newScoreboardWidth, setNewScoreboardWidth] = useState(800);
  const [newScoreboardHeight, setNewScoreboardHeight] = useState(600);
  const [newOffsetX, setNewOffsetX] = useState(0);
  const [newOffsetY, setNewOffsetY] = useState(0);
  const [savedScoreboards, setSavedScoreboards] = useState<TauriScoreboardConfig[]>([]);
  const [selectedScoreboardId, setSelectedScoreboardId] = useState<string>('');
  const [isLoadingScoreboards, setIsLoadingScoreboards] = useState(false);
  const [courtFilter, setCourtFilter] = useState<string>('');

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
      selectedScoreboardId,
      undefined,
      courtFilter.trim() || undefined
    );

    if (instanceId) {
      // Reset form
      setSelectedScoreboardId('');
      setNewOffsetX(0);
      setNewOffsetY(0);
      setCourtFilter('');
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
    if (selectedScoreboardId) {
      const dimensions = getSelectedScoreboardDimensions();
      setNewScoreboardWidth(dimensions.width);
      setNewScoreboardHeight(dimensions.height);
    }
  }, [selectedScoreboardId]);

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
          {/* Monitor Selection */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Target Monitor
              </h3>
              <button
                onClick={() => loadMonitors()}
                disabled={isLoadingMonitors}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
                title="Refresh monitor list"
              >
                <svg className={`w-3 h-3 ${isLoadingMonitors ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isLoadingMonitors ? 'Scanning...' : 'Refresh'}</span>
              </button>
            </div>
            
            {monitors.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedMonitor?.id || ''}
                  onChange={(e) => {
                    const monitorId = parseInt(e.target.value);
                    const monitor = monitors.find(m => m.id === monitorId);
                    selectMonitor(monitor || null);
                  }}
                  className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">{monitors.length === 1 ? 'Main Display' : 'Choose display...'}</option>
                  {monitors.map((monitor) => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.name} - {monitor.width}×{monitor.height} 
                      {monitor.is_primary ? ' (Primary)' : ''}
                      {monitor.scale_factor !== 1 ? ` @${monitor.scale_factor}x` : ''}
                    </option>
                  ))}
                </select>
                
                {selectedMonitor && (
                  <div className="text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-800/30 p-2 rounded border border-blue-200 dark:border-blue-600">
                    <div className="font-medium mb-1">📺 {selectedMonitor.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Total Size: {selectedMonitor.width}×{selectedMonitor.height}</div>
                      <div>Usable Area: {selectedMonitor.work_area_width}×{selectedMonitor.work_area_height}</div>
                      <div>Position: ({selectedMonitor.x}, {selectedMonitor.y})</div>
                      <div>Scale: {selectedMonitor.scale_factor}x</div>
                      <div>{selectedMonitor.is_primary ? '🌟 Primary' : '📄 Secondary'}</div>
                      <div className="text-gray-500">
                        {selectedMonitor.is_primary ? '(excludes menu bar & dock)' : '(full display area)'}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 p-2 rounded border border-blue-200 dark:border-blue-600">
                  <div className="font-medium mb-1">🎯 <strong>Fullscreen Scoreboard Mode</strong></div>
                  <div className="space-y-1">
                    <div>• Scoreboards open in <strong>fullscreen mode</strong> to completely hide the menu bar</div>
                    <div>• Use the <strong>fullscreen toggle button</strong> (⛶) to exit fullscreen if needed</div>
                    <div>• Press <strong>F11</strong> or <strong>Esc</strong> to exit fullscreen from the scoreboard window</div>
                    {monitors.length > 1 && (
                      <div>• Scoreboards will appear on the selected display with proper monitor positioning</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                No monitors detected. Please check your display connections.
              </p>
            )}
          </div>

          {/* Create New Scoreboard */}
          <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Scoreboard Display
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create display windows from your saved scoreboard designs. You must have at least one saved design to create displays.
            </p>
            

            {/* Saved Scoreboard Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Saved Scoreboard Design
              </label>
              {isLoadingScoreboards ? (
                <p className="text-sm text-gray-500">Loading saved scoreboards...</p>
              ) : savedScoreboards.length === 0 ? (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-md">
                  <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-2">
                    ⚠️ No saved scoreboards found
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You must create and save a scoreboard design first before you can create display windows.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedScoreboardId}
                  onChange={(e) => setSelectedScoreboardId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a saved scoreboard design...</option>
                  {savedScoreboards.map((scoreboard) => (
                    <option key={`saved-${scoreboard.id}`} value={scoreboard.id}>
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
                    disabled={!!selectedScoreboardId}
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
                    disabled={!!selectedScoreboardId}
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

            {/* Court Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🎾 Court Filter <span className="text-xs text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Court 1, Center Court, etc."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only receive matches for this specific court. Leave empty to receive all matches from all courts.
              </p>
            </div>

            <button
              onClick={handleCreateScoreboard}
              disabled={!selectedMonitor || isCreatingScoreboardWindow || !selectedScoreboardId}
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
          <div className="mt-1">
            {instance.scoreboardData?.courtFilter ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                Court: {instance.scoreboardData.courtFilter}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                All Courts
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => TauriAPI.toggleScoreboardFullscreen(instance.windowId)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="Toggle Fullscreen (F11 to exit)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 01-2 2h-2" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Close Scoreboard Window"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            * Size controls only work when not in fullscreen mode
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Final Position: ({instance.position.x + instance.position.offsetX}, {instance.position.y + instance.position.offsetY}) | 
        Size: {instance.size.width}x{instance.size.height}
      </div>
    </div>
  );
}; 