import { useState, useEffect } from 'react';
import { DesignCanvas } from './components/Designer/Canvas/DesignCanvas';
import { CreateScoreboardDialog } from './components/ui/CreateScoreboardDialog';
import { LoadScoreboardDialog } from './components/ui/LoadScoreboardDialog';
import { ImageManager } from './components/ui/ImageManager';
import { MultipleScoreboardManager } from './components/ui/MultipleScoreboardManager';
import { PropertyPanel } from './components/Designer/PropertyPanel';
import { useAppStore } from './stores/useAppStore';
import { useScoreboardStore } from './stores/useScoreboardStore';
import { useCanvasStore } from './stores/useCanvasStore';
import { ComponentType } from './types/scoreboard';
import { TauriAPI } from './lib/tauri';
import './App.css';

function App() {
  const {
    theme,
    monitors,
    scoreboardInstances,
    isLoadingMonitors,
    loadMonitors,
    lastError
  } = useAppStore();

  const {
    config,
    components,
    createNewScoreboard,
    addComponent,
  } = useScoreboardStore();

  const { setCanvasSize } = useCanvasStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showMultipleScoreboardManager, setShowMultipleScoreboardManager] = useState(false);
  const [selectedComponentForImage, setSelectedComponentForImage] = useState<string | null>(null);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);

  useEffect(() => {
    // Initialize the app on mount
    loadMonitors();
  }, [loadMonitors]);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleSaveScoreboard = async () => {
    if (!config || components.length === 0) {
      alert('Please create a scoreboard design with components before saving.');
      return;
    }

    const saveData = {
      ...config,
      components: components
    };

    try {
      await TauriAPI.saveScoreboard(config.name, saveData);
      alert(`Scoreboard "${config.name}" saved successfully!`);
      const { markSaved } = useScoreboardStore.getState();
      markSaved();
    } catch (error) {
      console.error('Failed to save scoreboard:', error);
      alert('Failed to save scoreboard. Please try again.');
    }
  };

  const handleFitToScreen = () => {
    if (!config) return;
    
    const { width, height } = config.dimensions;
    
    // Get the canvas container element to determine available space
    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer) {
      const containerRect = canvasContainer.getBoundingClientRect();
      
      // Account for padding/margins (40px on each side for padding)
      const availableWidth = containerRect.width - 80;
      const availableHeight = containerRect.height - 80;
      
      // Calculate zoom to fit with 10% padding
      const scaleX = (availableWidth * 0.9) / width;
      const scaleY = (availableHeight * 0.9) / height;
      const optimalZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
      
      // Apply the zoom and center the canvas
      const canvasStore = useCanvasStore.getState();
      canvasStore.setZoom(Math.max(0.1, optimalZoom));
      
      // Center the canvas in the viewport
      const scaledWidth = width * optimalZoom;
      const scaledHeight = height * optimalZoom;
      const panX = (availableWidth - scaledWidth) / 2;
      const panY = (availableHeight - scaledHeight) / 2;
      
      canvasStore.setPan(panX, panY);
    }
  };

  // Auto-fit canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (config) {
        // Small delay to ensure layout has updated
        setTimeout(() => {
          handleFitToScreen();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config, handleFitToScreen]);


  if (isLoadingMonitors) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monitors...</p>
        </div>
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="text-destructive mb-2">⚠️ Error</div>
          <p className="text-sm text-muted-foreground">{lastError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Scoreboard Designer
            </h1>
            {config && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {config.name} - {config.dimensions.width}x{config.dimensions.height}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Fit to Screen Button - only show when config is loaded */}
            {config && (
              <button
                onClick={handleFitToScreen}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                title="Fit scoreboard to screen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Fit to Screen</span>
              </button>
            )}

            {/* Save Scoreboard Button - only show when config is loaded */}
            {config && (
              <button
                onClick={handleSaveScoreboard}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                title="Save current scoreboard design"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save Design</span>
              </button>
            )}

            {/* Multiple Scoreboard Manager Button */}
            <button
              onClick={() => setShowMultipleScoreboardManager(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Multiple Scoreboards ({scoreboardInstances.length})</span>
            </button>

            <button
              onClick={() => setShowLoadDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Load Scoreboard</span>
            </button>
            
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              New Scoreboard
            </button>
            
            <button
              onClick={() => setShowImageManager(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Manage Images
            </button>

            <button
              onClick={() => setShowPropertyPanel(!showPropertyPanel)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              title={showPropertyPanel ? 'Hide Property Panel' : 'Show Property Panel'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              <span>{showPropertyPanel ? 'Hide Properties' : 'Show Properties'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Components</h2>
            
            {/* Monitor Status */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monitor Status</h3>
              {isLoadingMonitors ? (
                <p className="text-xs text-gray-500">Loading monitors...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {monitors.length} monitor(s) detected
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {scoreboardInstances.length} active scoreboard(s)
                  </p>
                </div>
              )}
            </div>

            {/* Component Library */}
            <div className="space-y-2">
              {[
                'SCORE', 'TIMER', 'TEAM_NAME', 'TEXT', 'IMAGE', 'PERIOD', 'LOGO',
                'RECTANGLE', 'CIRCLE', 'TENNIS_SET_SCORE', 'TENNIS_GAME_SCORE',
                'TENNIS_CURRENT_GAME', 'TENNIS_SERVER_INDICATOR', 'TENNIS_PLAYER_NAME',
                'TENNIS_MATCH_STATUS', 'TENNIS_TIEBREAK_SCORE', 'BACKGROUND_COLOR'
              ].map((componentType) => (
                <button
                  key={componentType}
                  onClick={() => {
                    if (config) {
                      addComponent(componentType as ComponentType, { x: 100, y: 100 });
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  disabled={!config}
                >
                  {componentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1">
            {config ? (
              <DesignCanvas />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg mb-2">No Scoreboard Loaded</p>
                  <p className="text-sm mb-4">Create a new scoreboard to get started</p>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Create New Scoreboard
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Property Panel */}
          {showPropertyPanel && config && (
            <PropertyPanel isOpen={true} />
          )}
        </main>
      </div>

      {/* Dialogs */}
      <CreateScoreboardDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateScoreboard={(name: string, width: number, height: number) => {
          createNewScoreboard(name, width, height, 'GENERIC' as any);
          
          // Update canvas size to match scoreboard dimensions
          setCanvasSize(width, height);
          
          setShowCreateDialog(false);
        }}
      />

      <LoadScoreboardDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
      />

      <ImageManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        onSelectImage={(image: any) => { // Changed StoredImage to any
          if (selectedComponentForImage) {
            const { updateComponentData } = useScoreboardStore.getState();
            updateComponentData(selectedComponentForImage, {
              imageId: image.id,
              imageUrl: image.path,
              text: image.name
            });
            setSelectedComponentForImage(null);
          }
          setShowImageManager(false);
        }}
      />

      <MultipleScoreboardManager
        isOpen={showMultipleScoreboardManager}
        onClose={() => setShowMultipleScoreboardManager(false)}
      />

      {/* Error Toast */}
      {lastError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{lastError}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;