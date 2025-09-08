import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { CompositeScoreboardLayout, CompositeScoreboardArea, PRESET_LAYOUTS } from '../../types/compositeScoreboard';
import { TauriAPI, TauriScoreboardConfig } from '../../lib/tauri';

interface CompositeScoreboardManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompositeScoreboardManager: React.FC<CompositeScoreboardManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    monitors,
    selectedMonitor,
    selectMonitor,
    loadMonitors,
    isLoadingMonitors,
    lastError,
  } = useAppStore();

  const [layout, setLayout] = useState<CompositeScoreboardLayout>(() => ({
    id: 'custom_layout',
    name: 'Custom Layout',
    totalWidth: 1920,
    totalHeight: 1080,
    areas: [
      {
        id: 'main',
        name: 'Main Scoreboard',
        x: 0,
        y: 0,
        width: 896,
        height: 512
      },
      {
        id: 'secondary',
        name: 'Secondary Scoreboard',
        x: 0,
        y: 512,
        width: 384,
        height: 256
      }
    ],
    background: { color: '#000000', opacity: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const [savedScoreboards, setSavedScoreboards] = useState<TauriScoreboardConfig[]>([]);

  // Load saved scoreboards when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSavedScoreboards();
    }
  }, [isOpen]);

  // Auto-adjust layout size when monitor is selected
  useEffect(() => {
    if (selectedMonitor && selectedMonitor.width && selectedMonitor.height) {
      setLayout(prev => ({
        ...prev,
        totalWidth: selectedMonitor.width,
        totalHeight: selectedMonitor.height,
        // Proportionally adjust existing areas
        areas: prev.areas.map(area => ({
          ...area,
          x: Math.round((area.x / prev.totalWidth) * selectedMonitor.width),
          y: Math.round((area.y / prev.totalHeight) * selectedMonitor.height),
          width: Math.round((area.width / prev.totalWidth) * selectedMonitor.width),
          height: Math.round((area.height / prev.totalHeight) * selectedMonitor.height),
        })),
        updatedAt: new Date(),
      }));
    }
  }, [selectedMonitor]);

  const loadSavedScoreboards = async () => {
    try {
      const scoreboards = await TauriAPI.listScoreboards();
      setSavedScoreboards(scoreboards);
    } catch (error) {
      console.error('Failed to load saved scoreboards:', error);
    }
  };

  const loadPresetLayout = (presetId: keyof typeof PRESET_LAYOUTS) => {
    const preset = PRESET_LAYOUTS[presetId];
    setLayout({
      id: preset.id,
      name: preset.name,
      totalWidth: preset.totalWidth,
      totalHeight: preset.totalHeight,
      areas: preset.areas.map(area => ({
        ...area,
        scoreboardId: undefined,
        scoreboardData: undefined
      })),
      background: { color: '#000000', opacity: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const updateArea = (areaId: string, updates: Partial<CompositeScoreboardArea>) => {
    setLayout(prev => ({
      ...prev,
      areas: prev.areas.map(area => 
        area.id === areaId ? { ...area, ...updates } : area
      ),
      updatedAt: new Date(),
    }));
  };

  const addArea = () => {
    const newArea: CompositeScoreboardArea = {
      id: `area_${Date.now()}`,
      name: `Area ${layout.areas.length + 1}`,
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    };
    setLayout(prev => ({
      ...prev,
      areas: [...prev.areas, newArea],
      updatedAt: new Date(),
    }));
  };

  const removeArea = (areaId: string) => {
    setLayout(prev => ({
      ...prev,
      areas: prev.areas.filter(area => area.id !== areaId),
      updatedAt: new Date(),
    }));
  };

  const createCompositeScoreboard = async () => {
    if (!selectedMonitor) {
      alert('Please select a monitor');
      return;
    }

    try {
      // Create the composite scoreboard window
      const windowId = `composite_scoreboard_${Date.now()}`;
      
      // Use the monitor's actual dimensions, or layout dimensions if monitor info not available
      const windowWidth = selectedMonitor.width || layout.totalWidth;
      const windowHeight = selectedMonitor.height || layout.totalHeight;
      
      // Position window at monitor's coordinates
      const windowX = selectedMonitor.x || 0;
      const windowY = selectedMonitor.y || 0;
      
      console.log('Creating composite scoreboard:', {
        windowId,
        monitorId: selectedMonitor.id,
        monitor: selectedMonitor,
        windowSize: `${windowWidth}x${windowHeight}`,
        windowPosition: `${windowX},${windowY}`,
        layout
      });
      
      await TauriAPI.createScoreboardWindow(
        windowId,
        selectedMonitor.id,
        windowWidth,
        windowHeight,
        windowX,
        windowY,
        0, // monitor offset x
        0, // monitor offset y
        layout
      );

      console.log('Composite scoreboard created successfully');
      onClose();
    } catch (error) {
      console.error('Failed to create composite scoreboard:', error);
      alert('Failed to create composite scoreboard: ' + error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Composite Scoreboard Manager
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
              >
                <svg className={`w-3 h-3 ${isLoadingMonitors ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isLoadingMonitors ? 'Scanning...' : 'Refresh'}</span>
              </button>
            </div>
            
            {monitors.length > 0 ? (
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
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                No monitors detected. Please check your display connections.
              </p>
            )}
          </div>

          {/* Layout Configuration */}
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Layout Configuration
            </h3>

            {/* Preset Layouts */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadPresetLayout('MAIN_PLUS_PIP')}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                >
                  Main + PIP (Your Layout)
                </button>
                <button
                  onClick={() => loadPresetLayout('DUAL_HORIZONTAL')}
                  className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded"
                >
                  Dual Horizontal
                </button>
                <button
                  onClick={() => loadPresetLayout('QUAD_SPLIT')}
                  className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
                >
                  Quad Split
                </button>
              </div>
            </div>

            {/* Overall Layout Settings */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Layout Name
                </label>
                <input
                  type="text"
                  value={layout.name}
                  onChange={(e) => setLayout(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Width
                </label>
                <input
                  type="number"
                  value={layout.totalWidth}
                  onChange={(e) => setLayout(prev => ({ ...prev, totalWidth: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Height
                </label>
                <input
                  type="number"
                  value={layout.totalHeight}
                  onChange={(e) => setLayout(prev => ({ ...prev, totalHeight: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Visual Layout Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Layout Preview
              </label>
              <div 
                className="relative border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                style={{
                  width: '100%',
                  height: '200px',
                  maxWidth: '400px'
                }}
              >
                {layout.areas.map((area) => (
                  <div
                    key={area.id}
                    className="absolute border border-blue-400 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-800 dark:text-blue-200"
                    style={{
                      left: `${(area.x / layout.totalWidth) * 100}%`,
                      top: `${(area.y / layout.totalHeight) * 100}%`,
                      width: `${(area.width / layout.totalWidth) * 100}%`,
                      height: `${(area.height / layout.totalHeight) * 100}%`,
                    }}
                  >
                    {area.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Scoreboard Areas */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scoreboard Areas ({layout.areas.length})
                </label>
                <button
                  onClick={addArea}
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Add Area
                </button>
              </div>
              
              <div className="space-y-3">
                {layout.areas.map((area) => (
                  <AreaEditor
                    key={area.id}
                    area={area}
                    savedScoreboards={savedScoreboards}
                    onUpdate={(updates) => updateArea(area.id, updates)}
                    onRemove={() => removeArea(area.id)}
                  />
                ))}
              </div>
            </div>

            {/* Quick Fill Options */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                Quick Fill Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    // Fill all areas with the same first available scoreboard
                    const firstScoreboard = savedScoreboards[0];
                    if (firstScoreboard) {
                      setLayout(prev => ({
                        ...prev,
                        areas: prev.areas.map(area => ({ ...area, scoreboardId: firstScoreboard.id }))
                      }));
                    }
                  }}
                  disabled={savedScoreboards.length === 0}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 rounded transition-colors"
                >
                  Fill All with First Scoreboard
                </button>
                <button
                  onClick={() => {
                    // Fill each area with different scoreboards if available
                    setLayout(prev => ({
                      ...prev,
                      areas: prev.areas.map((area, index) => ({ 
                        ...area, 
                        scoreboardId: savedScoreboards[index % savedScoreboards.length]?.id 
                      }))
                    }));
                  }}
                  disabled={savedScoreboards.length === 0}
                  className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 disabled:opacity-50 text-green-800 rounded transition-colors"
                >
                  Fill with Different Scoreboards
                </button>
                <button
                  onClick={() => {
                    // Clear all scoreboard assignments
                    setLayout(prev => ({
                      ...prev,
                      areas: prev.areas.map(area => ({ ...area, scoreboardId: undefined }))
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
                >
                  Clear All Assignments
                </button>
              </div>
              {savedScoreboards.length === 0 && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  💡 Create some scoreboards first to assign them to areas
                </p>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={createCompositeScoreboard}
              disabled={!selectedMonitor || layout.areas.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Create Composite Scoreboard Display
            </button>
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

interface AreaEditorProps {
  area: CompositeScoreboardArea;
  savedScoreboards: TauriScoreboardConfig[];
  onUpdate: (updates: Partial<CompositeScoreboardArea>) => void;
  onRemove: () => void;
}

const AreaEditor: React.FC<AreaEditorProps> = ({ area, savedScoreboards, onUpdate, onRemove }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-start mb-3">
        <input
          type="text"
          value={area.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="font-medium bg-transparent border-none text-gray-900 dark:text-white focus:outline-none"
        />
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X Position</label>
          <input
            type="number"
            value={area.x}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y Position</label>
          <input
            type="number"
            value={area.y}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
          <input
            type="number"
            value={area.width}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
          <input
            type="number"
            value={area.height}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Scoreboard Design</label>
        <select
          value={area.scoreboardId || ''}
          onChange={(e) => onUpdate({ scoreboardId: e.target.value || undefined })}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">No scoreboard (blank area)</option>
          {savedScoreboards.map((scoreboard) => (
            <option key={scoreboard.id} value={scoreboard.id}>
              {scoreboard.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};