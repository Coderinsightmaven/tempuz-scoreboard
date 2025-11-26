import { useState, useEffect } from 'react';
import './App.css';
import { useAppStore } from './stores/useAppStore';
import { useScoreboardStore } from './stores/useScoreboardStore';
import { useCanvasStore } from './stores/useCanvasStore';
import { DesignCanvas } from './components/Designer/Canvas/DesignCanvas';
import { PropertyPanel } from './components/Designer/PropertyPanel';
import { CreateScoreboardDialog } from './components/ui/CreateScoreboardDialog';
import { LoadScoreboardDialog } from './components/ui/LoadScoreboardDialog';
import { SaveScoreboardDialog } from './components/ui/SaveScoreboardDialog';
import { MultipleScoreboardManager } from './components/ui/MultipleScoreboardManager';
import { ScoreboardManager } from './components/ui/ScoreboardManager';
import { AppHeader } from './components/ui/AppHeader';
import { ComponentLibrary } from './components/ui/ComponentLibrary';
import { useTennisApiAutoConnect } from './hooks/useTennisApiAutoConnect';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useScoreboardImportExport } from './hooks/useScoreboardImportExport';
import { TauriAPI } from './lib/tauri';
import { ComponentType } from './types/scoreboard';
import { useImageStore } from './stores/useImageStore';

/**
 * Main App component that orchestrates the scoreboard designer application.
 * 
 * Responsibilities:
 * - Initializes app state and loads monitors/images
 * - Manages UI state for dialogs and panels
 * - Handles theme switching
 * - Coordinates between stores and components
 * - Provides layout structure (header, sidebar, canvas, property panel)
 */
function App() {
  const {
    theme,
    scoreboardInstances,
    isLoadingMonitors,
    loadMonitors
  } = useAppStore();

  const {
    config,
    components,
    createNewScoreboard,
    addComponent,
  } = useScoreboardStore();

  const { setCanvasSize, selectedComponents, clipboard } = useCanvasStore();
  const { loadImages } = useImageStore();

  // UI state for dialogs and panels
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showMultipleManager, setShowMultipleManager] = useState(false);
  const [showScoreboardManager, setShowScoreboardManager] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);

  // Initialize app on mount
  useEffect(() => {
    // Load monitors and images when app starts
    loadMonitors();
    loadImages();

    // Note: Rust tennis processor is initialized on-demand when needed
    console.log('🎾 App initialized - Rust tennis processor will be used on-demand');
  }, [loadMonitors, loadImages]);

  // Auto-connect to tennis API on startup
  useTennisApiAutoConnect();

  // Set up keyboard shortcuts for copy/paste
  const { handleCopyComponents, handlePasteComponents } = useKeyboardShortcuts(config);

  // Set up import/export handlers
  const { handleExportScoreboard, handleImportScoreboard } = useScoreboardImportExport(config, components);

  // Theme handling - applies dark/light theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  /**
   * Opens the save dialog to save the current scoreboard.
   * Validates that a scoreboard with components exists before showing dialog.
   */
  const handleSaveScoreboard = () => {
    if (!config || components.length === 0) {
      alert('Please create a scoreboard design with components before saving.');
      return;
    }

    setShowSaveDialog(true);
  };

  /**
   * Saves the scoreboard with the given name.
   * 
   * @param scoreboardName - The name to save the scoreboard as
   */
  const handleSaveScoreboardWithName = async (scoreboardName: string) => {
    const saveData = {
      ...config,
      name: scoreboardName,
      components: components
    };

    try {
      await TauriAPI.saveScoreboard(scoreboardName, saveData);
      alert(`Scoreboard "${scoreboardName}" saved successfully!`);
      const { markSaved } = useScoreboardStore.getState();
      markSaved();
    } catch (error) {
      console.error('Failed to save scoreboard:', error);
      alert('Failed to save scoreboard. Please try again.');
    }
  };

  /**
   * Fits the canvas to the screen by calculating optimal zoom and pan.
   * Centers the canvas in the viewport with 10% padding.
   */
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


  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header with all action buttons */}
      <AppHeader
        config={config}
        scoreboardInstancesCount={scoreboardInstances.length}
        selectedComponentsCount={selectedComponents.size}
        clipboardCount={clipboard.length}
        showPropertyPanel={showPropertyPanel}
        onFitToScreen={handleFitToScreen}
        onSave={handleSaveScoreboard}
        onExport={handleExportScoreboard}
        onImport={handleImportScoreboard}
        onCopy={handleCopyComponents}
        onPaste={handlePasteComponents}
        onShowMultipleManager={() => setShowMultipleManager(true)}
        onShowLoadDialog={() => setShowLoadDialog(true)}
        onShowCreateDialog={() => setShowCreateDialog(true)}
        onShowScoreboardManager={() => setShowScoreboardManager(true)}
        onTogglePropertyPanel={() => setShowPropertyPanel(!showPropertyPanel)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        <ComponentLibrary onAddComponent={addComponent} />

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
            <PropertyPanel />
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

      <SaveScoreboardDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveScoreboardWithName}
        currentName={config?.name || 'Untitled Scoreboard'}
      />

      <MultipleScoreboardManager
        isOpen={showMultipleManager}
        onClose={() => setShowMultipleManager(false)}
      />

      <ScoreboardManager
        isOpen={showScoreboardManager}
        onClose={() => setShowScoreboardManager(false)}
      />

    </div>
  );
}

export default App;