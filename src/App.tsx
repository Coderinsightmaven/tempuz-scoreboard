import { useState, useEffect } from 'react';
import './App.css';
import { useAppStore } from './stores/useAppStore';
import { useScoreboardStore } from './stores/useScoreboardStore';
import { useCanvasStore } from './stores/useCanvasStore';
import { DesignCanvas } from './components/Designer/Canvas/DesignCanvas';
import { PropertyPanel } from './components/Designer/PropertyPanel';
import { CreateScoreboardDialog } from './components/ui/CreateScoreboardDialog';
import { LoadScoreboardDialog } from './components/ui/LoadScoreboardDialog';
import { MultipleScoreboardManager } from './components/ui/MultipleScoreboardManager';
import { ScoreboardManager } from './components/ui/ScoreboardManager';
import { TennisApiConnectionButton } from './components/ui/TennisApiConnectionButton';
import { TauriAPI } from './lib/tauri';
import { ComponentType } from './types/scoreboard';
import { useImageStore } from './stores/useImageStore';
import { useLiveDataStore } from './stores/useLiveDataStore';

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
    copyComponents,
    pasteComponents,
  } = useScoreboardStore();

  const { setCanvasSize, selectedComponents, clipboard, setClipboard } = useCanvasStore();
  const { loadImages } = useImageStore();

  const {
    connectToTennisApi,
    tennisApiConnected,
    clearError
  } = useLiveDataStore();

  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showMultipleManager, setShowMultipleManager] = useState(false);
  const [showScoreboardManager, setShowScoreboardManager] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);

  useEffect(() => {
    // Initialize the app on mount
    loadMonitors();
    loadImages();
  }, [loadMonitors, loadImages]);

  // Separate effect for tennis API auto-connection
  useEffect(() => {
    autoConnectToTennisApi();
  }, []); // Empty dependency array - only run once on mount

  // Auto-connect to tennis API on app startup
  const autoConnectToTennisApi = async () => {
    // Only attempt auto-connection if not already connected
    if (tennisApiConnected) {
      console.log('🎾 App: Already connected to tennis API');
      return;
    }

    console.log('🎾 App: Attempting automatic connection to tennis API...');

    // Clear any previous errors
    clearError();

    try {
      // Use default development settings
      const apiUrl = 'http://localhost:3000';
      const apiKey = 'dev-api-key-12345';

      console.log('🎾 App: Connecting to:', apiUrl);
      console.log('🎾 App: Using API key:', apiKey.substring(0, 10) + '...');

      // Store auto-connection flag in localStorage to track attempts
      localStorage.setItem('tennisApiAutoConnecting', 'true');

      connectToTennisApi(apiUrl, apiKey);

      console.log('🎾 App: Auto-connection initiated, connection will happen asynchronously');
    } catch (error) {
      console.warn('🎾 App: Auto-connection failed:', error);
      localStorage.removeItem('tennisApiAutoConnecting');
      // Don't show error to user - this is automatic and shouldn't interrupt workflow
    }
  };

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when a scoreboard is loaded
      if (!config) return;
      
      const isCtrlCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlCmd && event.key === 'c') {
        event.preventDefault();
        handleCopyComponents();
      } else if (isCtrlCmd && event.key === 'v') {
        event.preventDefault();
        handlePasteComponents();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [config, selectedComponents, clipboard]);

  const handleCopyComponents = () => {
    if (selectedComponents.size === 0) {
      alert('Please select components to copy.');
      return;
    }
    
    const selectedIds = Array.from(selectedComponents);
    const componentsToCopy = copyComponents(selectedIds);
    setClipboard(componentsToCopy);
    
    const componentText = selectedIds.length === 1 ? 'component' : 'components';
    alert(`${selectedIds.length} ${componentText} copied to clipboard.`);
  };

  const handlePasteComponents = () => {
    if (clipboard.length === 0) {
      alert('No components in clipboard. Copy components first.');
      return;
    }
    
    const newComponentIds = pasteComponents(clipboard);
    
    const componentText = newComponentIds.length === 1 ? 'component' : 'components';
    alert(`${newComponentIds.length} ${componentText} pasted successfully.`);
  };

  const handleExportScoreboard = async () => {
    if (!config) {
      alert('Please create a scoreboard design before exporting.');
      return;
    }

    try {
      // Import save dialog from Tauri
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      // Show save dialog
      const filePath = await save({
        defaultPath: `${config.name}_export.zip`,
        filters: [
          {
            name: 'ZIP Files',
            extensions: ['zip']
          }
        ]
      });

      // User cancelled the dialog
      if (!filePath) {
        return;
      }

      // First, ensure the scoreboard is saved to disk before exporting
      const saveData = {
        ...config,
        components: components
      };

      // Save the scoreboard to disk first
      const filename = await TauriAPI.saveScoreboard(config.name, saveData);
      console.log('📁 Scoreboard saved to disk for export:', filename);
      
      // Now export the saved scoreboard as zip data
      const zipData = await TauriAPI.exportScoreboardAsZip(filename);
      
      // Write the zip data directly to the chosen file path
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      await writeFile(filePath, new Uint8Array(zipData));
      
      // Mark as saved since we just saved it
      const { markSaved } = useScoreboardStore.getState();
      markSaved();
      
      alert(`Scoreboard "${config.name}" exported successfully to:\n${filePath}`);
    } catch (error) {
      console.error('Failed to export scoreboard:', error);
      alert('Failed to export scoreboard. Please try again.');
    }
  };

  const handleImportScoreboard = async () => {
    try {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.style.display = 'none';
      
      // Handle file selection
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        try {
          // Read file as array buffer
          const arrayBuffer = await file.arrayBuffer();
          const zipData = Array.from(new Uint8Array(arrayBuffer));
          
          // Import the scoreboard
          const importedTauriConfig = await TauriAPI.importScoreboardFromZip(zipData);
          
          // Convert TauriScoreboardConfig to ScoreboardConfig format
          const importedConfig = {
            ...importedTauriConfig.data,
            id: importedTauriConfig.id,
            name: importedTauriConfig.name,
          };
          
          // Load the imported scoreboard into the designer
          const { loadScoreboard } = useScoreboardStore.getState();
          await loadScoreboard(importedConfig);
          
          // Refresh images
          const { loadImages } = useImageStore.getState();
          await loadImages();
          
          alert(`Scoreboard "${importedConfig.name}" imported successfully!`);
        } catch (error) {
          console.error('Failed to import scoreboard:', error);
          alert('Failed to import scoreboard. Please ensure the file is a valid scoreboard ZIP.');
        } finally {
          // Clean up
          document.body.removeChild(input);
        }
      };
      
      // Trigger file dialog
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      alert('Failed to open file dialog. Please try again.');
    }
  };

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

            <>
              {/* Save/Export Buttons - only show when config is loaded */}
              {config && (
                <>
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
                  
                  <button
                    onClick={handleExportScoreboard}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    title="Export scoreboard with images as ZIP"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <span>Export ZIP</span>
                  </button>
                </>
              )}

              {/* Import ZIP Button - always visible */}
              <button
                onClick={handleImportScoreboard}
                className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                title="Import scoreboard from ZIP file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Import ZIP</span>
              </button>

              {/* Copy/Paste Buttons - only show when config is loaded */}
              {config && (
              <>
                <button
                  onClick={handleCopyComponents}
                  disabled={selectedComponents.size === 0}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy selected components (Ctrl+C)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy ({selectedComponents.size})</span>
                </button>
                
                <button
                  onClick={handlePasteComponents}
                  disabled={clipboard.length === 0}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Paste components (Ctrl+V)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Paste ({clipboard.length})</span>
                </button>
              </>
              )}
            </>

            {/* Multiple Scoreboard Manager Button */}
            <button
              onClick={() => setShowMultipleManager(true)}
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
              onClick={() => setShowScoreboardManager(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Manage Scoreboards</span>
            </button>

            <TennisApiConnectionButton />

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
        {/* Left Sidebar - Component Types */}
        <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
          <h3 className="font-medium mb-4">Components</h3>
          <div className="space-y-2">
            <button
              onClick={() => addComponent(ComponentType.BACKGROUND, { x: 100, y: 100 })}
              className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">BACKGROUND</div>
              <div className="text-sm text-gray-600">
                Add a background image (behind all components)
              </div>
            </button>
            <button
              onClick={() => addComponent(ComponentType.LOGO, { x: 100, y: 100 })}
              className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">LOGO</div>
              <div className="text-sm text-gray-600">
                Add a logo image (scalable and resizable)
              </div>
            </button>
            <button
              onClick={() => addComponent(ComponentType.TEXT, { x: 100, y: 100 })}
              className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">TEXT</div>
              <div className="text-sm text-gray-600">
                Add a text overlay
              </div>
            </button>
            <button
              onClick={() => addComponent(ComponentType.VIDEO, { x: 100, y: 100 })}
              className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">VIDEO</div>
              <div className="text-sm text-gray-600">
                Add a video player component
              </div>
            </button>
            
            {/* Tennis Live Data Components */}
            <div className="pt-4 border-t border-gray-300">
              <h4 className="font-medium mb-2 text-sm text-gray-700">Tennis Live Data</h4>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_PLAYER_NAME, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
              >
                <div className="font-medium text-sm">PLAYER NAME</div>
                <div className="text-xs text-gray-600">
                  Live player name display
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_DOUBLES_PLAYER_NAME, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
              >
                <div className="font-medium text-sm">DOUBLES PLAYER NAME</div>
                <div className="text-xs text-gray-600">
                  Live doubles team display (Lastname / Lastname)
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_GAME_SCORE, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
              >
                <div className="font-medium text-sm">GAME SCORE</div>
                <div className="text-xs text-gray-600">
                  Live game points (0, 15, 30, 40)
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_SET_SCORE, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
              >
                <div className="font-medium text-sm">SET SCORE</div>
                <div className="text-xs text-gray-600">
                  Live set score (games won)
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_MATCH_SCORE, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
              >
                <div className="font-medium text-sm">MATCH SCORE</div>
                <div className="text-xs text-gray-600">
                  Live match score (sets won)
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_DETAILED_SET_SCORE, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">DETAILED SET SCORE</div>
                <div className="text-xs text-gray-600">
                  Individual set scores by player
                </div>
              </button>
              <button
                onClick={() => addComponent(ComponentType.TENNIS_SERVING_INDICATOR, { x: 100, y: 100 })}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">SERVING INDICATOR</div>
                <div className="text-xs text-gray-600">
                  Shows which player is serving
                </div>
              </button>
            </div>
          </div>
        </div>

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