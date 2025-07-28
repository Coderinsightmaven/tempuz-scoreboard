import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useScoreboardStore } from './stores/useScoreboardStore';
import { useCanvasStore } from './stores/useCanvasStore';
import { SportType, ComponentType } from './types/scoreboard';
import { DesignCanvas } from './components/Designer/Canvas/DesignCanvas';
import { ColorPicker } from './components/ui/ColorPicker';
import { CreateScoreboardDialog } from './components/ui/CreateScoreboardDialog';
import { ImageManager } from './components/ui/ImageManager';
import { useImageStore, StoredImage } from './stores/useImageStore';
import './App.css';

function App() {
  const { 
    theme, 
    initializeApp, 
    lastError, 
    isLoadingMonitors, 
    monitors,
    scoreboardWindowOpen 
  } = useAppStore();
  
  const { 
    config, 
    components, 
    createNewScoreboard, 
    addComponent,
    updateComponentStyle,
    updateComponentSize,
    updateComponentPosition
  } = useScoreboardStore();
  
  const { canvasSize, zoom, selectedComponents: canvasSelection } = useCanvasStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedComponentForImage, setSelectedComponentForImage] = useState<string | null>(null);
  
  const { loadImages } = useImageStore();

  useEffect(() => {
    // Initialize the app on mount
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleCreateNewScoreboard = (name: string, width: number, height: number, sport: SportType) => {
    createNewScoreboard(name, width, height, sport);
    
    // Update canvas size to match scoreboard dimensions
    const canvasStore = useCanvasStore.getState();
    canvasStore.setCanvasSize(width, height);
    
    // Auto-fit the canvas to the viewport with some padding
    setTimeout(() => {
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
        
        // Apply the zoom
        canvasStore.setZoom(Math.max(0.1, optimalZoom));
        
        // Center the canvas in the viewport
        const scaledWidth = width * optimalZoom;
        const scaledHeight = height * optimalZoom;
        const panX = (availableWidth - scaledWidth) / 2;
        const panY = (availableHeight - scaledHeight) / 2;
        
        canvasStore.setPan(panX, panY);
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const handleFitToScreen = useCallback(() => {
    if (!config) return;
    
    const canvasStore = useCanvasStore.getState();
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
      
      // Apply the zoom
      canvasStore.setZoom(Math.max(0.1, optimalZoom));
      
      // Center the canvas in the viewport
      const scaledWidth = width * optimalZoom;
      const scaledHeight = height * optimalZoom;
      const panX = (availableWidth - scaledWidth) / 2;
      const panY = (availableHeight - scaledHeight) / 2;
      
      canvasStore.setPan(panX, panY);
    }
  }, [config]);

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

  const handleAddComponent = (type: ComponentType) => {
    if (!config) return;
    
    // Add component at center of canvas with some random offset
    const centerX = canvasSize.width / 2 + (Math.random() - 0.5) * 100;
    const centerY = canvasSize.height / 2 + (Math.random() - 0.5) * 100;
    
    addComponent(type, { x: centerX, y: centerY });
  };

  const handleColorChange = (componentId: string, color: { r: number; g: number; b: number; a?: number }) => {
    updateComponentStyle(componentId, { 
      rgbColor: color,
      backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`
    });
  };

  const handleSizeChange = (componentId: string, width: number, height: number) => {
    updateComponentSize(componentId, { width: Math.max(20, width), height: Math.max(20, height) });
  };

  const handlePositionChange = (componentId: string, x: number, y: number) => {
    updateComponentPosition(componentId, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const handleBackgroundOpacityChange = (componentId: string, opacity: number) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    
    // If component has RGB color, update its alpha
    if (component.style.rgbColor) {
      const { r, g, b } = component.style.rgbColor;
      updateComponentStyle(componentId, { 
        rgbColor: { r, g, b, a: clampedOpacity },
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
      });
    } else {
      // For components without RGB, convert existing background to RGBA
      const currentBg = component.style.backgroundColor || '#ffffff';
      // Simple hex to RGB conversion for common cases
      let r = 255, g = 255, b = 255;
      if (currentBg.startsWith('#')) {
        const hex = currentBg.slice(1);
        if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16);
          g = parseInt(hex.slice(2, 4), 16);
          b = parseInt(hex.slice(4, 6), 16);
        }
      }
      
      updateComponentStyle(componentId, { 
        rgbColor: { r, g, b, a: clampedOpacity },
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
      });
    }
  };

  const makeAllBackgroundsTransparent = (opacity: number = 0.5) => {
    components.forEach(component => {
      handleBackgroundOpacityChange(component.id, opacity);
    });
  };

  const resetAllBackgroundOpacity = () => {
    components.forEach(component => {
      handleBackgroundOpacityChange(component.id, 1);
    });
  };

  const handleSelectImageForComponent = (componentId: string) => {
    setSelectedComponentForImage(componentId);
    setShowImageSelector(true);
  };

  const handleImageSelected = (image: StoredImage) => {
    if (selectedComponentForImage) {
      const { updateComponentData } = useScoreboardStore.getState();
      updateComponentData(selectedComponentForImage, {
        imageId: image.id,
        imageUrl: `tauri://localhost/image/${image.id}`, // Tauri asset URL
        text: image.originalName
      });
    }
    setShowImageSelector(false);
    setSelectedComponentForImage(null);
  };

  const getSelectedComponent = () => {
    if (canvasSelection.size === 1) {
      const selectedId = Array.from(canvasSelection)[0];
      return components.find(c => c.id === selectedId);
    }
    return null;
  };



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
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header/Toolbar */}
      <header className="toolbar px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Scoreboard Designer</h1>
          {config && (
            <span className="text-sm text-muted-foreground">
              {config.name} ({config.dimensions.width}×{config.dimensions.height})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {config && (
            <>
              <button
                onClick={handleFitToScreen}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 
                           hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                title="Fit scoreboard to screen"
              >
                📐 Fit to Screen
              </button>
              
              {components.length > 0 && (
                <>
                  <button
                    onClick={() => makeAllBackgroundsTransparent(0.5)}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 
                               hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
                    title="Make all component backgrounds 50% transparent"
                  >
                    👻 50% BG Transparent
                  </button>
                  <button
                    onClick={() => makeAllBackgroundsTransparent(0.2)}
                    className="px-3 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 
                               hover:bg-orange-200 dark:hover:bg-orange-800 rounded transition-colors"
                    title="Make all component backgrounds 20% transparent (very transparent)"
                  >
                    🫥 20% BG Transparent
                  </button>
                  <button
                    onClick={resetAllBackgroundOpacity}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 
                               hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Reset all component backgrounds to fully opaque"
                  >
                    🔄 Reset BG Opacity
                  </button>
                </>
              )}
            </>
          )}
          <span className="text-xs text-muted-foreground">
            Monitors: {monitors.length}
          </span>
          {scoreboardWindowOpen && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
              Scoreboard Active
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="sidebar w-64 overflow-y-auto scrollbar-thin">
          <div className="panel-header">
            <span>Components</span>
          </div>
          <div className="panel-content">
            <div className="space-y-2">
              {/* General Components */}
              <div className="text-xs font-semibold text-muted-foreground mb-2">General</div>
              <button 
                onClick={() => handleAddComponent(ComponentType.SCORE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                📊 Score
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TIMER)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                ⏱️ Timer
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TEAM_NAME)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🏀 Team Name
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TEXT)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                📝 Text
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.LOGO)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🖼️ Logo
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.IMAGE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                📷 Image
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.PERIOD)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🔢 Period
              </button>

              {/* Tennis Components */}
              <div className="text-xs font-semibold text-muted-foreground mb-2 mt-4">Tennis</div>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_SET_SCORE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Set Score
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_GAME_SCORE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Game Score
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_CURRENT_GAME)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Games
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_PLAYER_NAME)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Player Name
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_SERVER_INDICATOR)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Server
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_TIEBREAK_SCORE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Tiebreak
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.TENNIS_MATCH_STATUS)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎾 Match Status
              </button>

              {/* Shapes & Background */}
              <div className="text-xs font-semibold text-muted-foreground mb-2 mt-4">Shapes</div>
              <button 
                onClick={() => handleAddComponent(ComponentType.BACKGROUND_COLOR)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                🎨 Background Color
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.RECTANGLE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                ⬜ Rectangle
              </button>
              <button 
                onClick={() => handleAddComponent(ComponentType.CIRCLE)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                disabled={!config}
              >
                ⭕ Circle
              </button>
            </div>

            {/* Image Management */}
            <div className="mt-4 pt-4 border-t border-border">
              <button 
                onClick={() => setShowImageManager(true)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              >
                🗂️ Manage Images
              </button>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!config ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Welcome to Scoreboard Designer</h2>
                <p className="text-muted-foreground mb-6">
                  Create a new scoreboard or open an existing one to get started.
                </p>
                <button 
                  onClick={openCreateDialog}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create New Scoreboard
                </button>
              </div>
            </div>
          ) : (
            <DesignCanvas />
          )}
        </main>

        {/* Property Panel */}
        <aside className="property-panel w-64 overflow-y-auto scrollbar-thin">
          <div className="panel-header">
            <span>Properties</span>
          </div>
          <div className="panel-content">
            {canvasSelection.size > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">
                  {canvasSelection.size} component(s) selected
                </div>
                
                {canvasSelection.size === 1 && (() => {
                  const selectedComponent = getSelectedComponent();
                  if (!selectedComponent) return null;
                  
                  return (
                    <div className="space-y-4">
                      {/* Component Type */}
                      <div>
                        <label className="form-label">Type</label>
                        <div className="text-sm text-muted-foreground">
                          {selectedComponent.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>

                      {/* RGB Color Picker for Background Color and other components */}
                      {(selectedComponent.type === ComponentType.BACKGROUND_COLOR || 
                        selectedComponent.style.rgbColor) && (
                        <ColorPicker
                          color={selectedComponent.style.rgbColor || { r: 59, g: 130, b: 246, a: 1 }}
                          onChange={(color) => handleColorChange(selectedComponent.id, color)}
                          label="Background Color"
                        />
                      )}

                      {/* Image Component Controls */}
                      {selectedComponent.type === ComponentType.IMAGE && (
                        <div>
                          <label className="form-label">Image Settings</label>
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              Current: {selectedComponent.data.imageId ? selectedComponent.data.text : 'No image selected'}
                            </div>
                            <button
                              onClick={() => handleSelectImageForComponent(selectedComponent.id)}
                              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              {selectedComponent.data.imageId ? 'Change Image' : 'Select Image'}
                            </button>
                            {selectedComponent.data.imageId && (
                              <button
                                onClick={() => {
                                  const { updateComponentData } = useScoreboardStore.getState();
                                  updateComponentData(selectedComponent.id, {
                                    imageId: undefined,
                                    imageUrl: undefined,
                                    text: 'No Image'
                                  });
                                }}
                                className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tennis Component Controls */}
                      {selectedComponent.type.startsWith('tennis-') && (
                        <div>
                          <label className="form-label">Tennis Settings</label>
                          <div className="text-xs text-muted-foreground">
                            Tennis-specific controls coming soon...
                          </div>
                        </div>
                      )}

                      {/* Position Controls */}
                      <div>
                        <label className="form-label">Position (px)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">X</label>
                            <input
                              type="number"
                              value={Math.round(selectedComponent.position.x)}
                              onChange={(e) => handlePositionChange(
                                selectedComponent.id, 
                                parseInt(e.target.value) || 0, 
                                selectedComponent.position.y
                              )}
                              className="w-full px-2 py-1 text-sm border border-border rounded"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Y</label>
                            <input
                              type="number"
                              value={Math.round(selectedComponent.position.y)}
                              onChange={(e) => handlePositionChange(
                                selectedComponent.id, 
                                selectedComponent.position.x,
                                parseInt(e.target.value) || 0
                              )}
                              className="w-full px-2 py-1 text-sm border border-border rounded"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Size Controls */}
                      <div>
                        <label className="form-label">Size (px)</label>
                        
                        {/* Size Presets */}
                        <div className="mb-2">
                          <label className="text-xs text-muted-foreground">Quick Sizes</label>
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 100, 50)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              100×50
                            </button>
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 200, 100)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              200×100
                            </button>
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 300, 150)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              300×150
                            </button>
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 150, 150)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              150×150
                            </button>
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 400, 200)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              400×200
                            </button>
                            <button
                              onClick={() => handleSizeChange(selectedComponent.id, 50, 50)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              50×50
                            </button>
                          </div>
                        </div>

                        {/* Manual Size Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Width</label>
                            <input
                              type="number"
                              value={selectedComponent.size.width}
                              onChange={(e) => handleSizeChange(
                                selectedComponent.id, 
                                parseInt(e.target.value) || 20, 
                                selectedComponent.size.height
                              )}
                              className="w-full px-2 py-1 text-sm border border-border rounded"
                              min="20"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Height</label>
                            <input
                              type="number"
                              value={selectedComponent.size.height}
                              onChange={(e) => handleSizeChange(
                                selectedComponent.id, 
                                selectedComponent.size.width,
                                parseInt(e.target.value) || 20
                              )}
                              className="w-full px-2 py-1 text-sm border border-border rounded"
                              min="20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Background Transparency Control */}
                      <div>
                        <label className="form-label">Background Transparency</label>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Background Opacity</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((selectedComponent.style.rgbColor?.a || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedComponent.style.rgbColor?.a || 1}
                            onChange={(e) => handleBackgroundOpacityChange(selectedComponent.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Transparent BG</span>
                            <span>Solid BG</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Note: Only background becomes transparent, text stays visible
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a component to edit its properties.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          {config && (
            <span>
              Components: {components.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Theme: {theme}</span>
        </div>
      </footer>

      {/* Create Scoreboard Dialog */}
      <CreateScoreboardDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateScoreboard={handleCreateNewScoreboard}
      />

      {/* Image Manager Dialog */}
      <ImageManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        selectMode={false}
      />

      {/* Image Selector Dialog */}
      <ImageManager
        isOpen={showImageSelector}
        onClose={() => {
          setShowImageSelector(false);
          setSelectedComponentForImage(null);
        }}
        selectMode={true}
        onSelectImage={handleImageSelected}
      />
    </div>
  );
}

export default App;
