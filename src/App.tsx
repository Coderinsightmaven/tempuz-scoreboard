import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useScoreboardStore } from './stores/useScoreboardStore';
import { useCanvasStore } from './stores/useCanvasStore';
import { SportType, ComponentType } from './types/scoreboard';
import { DesignCanvas } from './components/Designer/Canvas/DesignCanvas';
import { ColorPicker } from './components/ui/ColorPicker';
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
    updateComponentStyle
  } = useScoreboardStore();
  
  const { canvasSize, zoom, selectedComponents: canvasSelection } = useCanvasStore();

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

  const handleCreateNewScoreboard = () => {
    createNewScoreboard('New Tennis Scoreboard', 1920, 1080, SportType.TENNIS);
  };

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
                  onClick={handleCreateNewScoreboard}
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

                      {/* Tennis Component Controls */}
                      {selectedComponent.type.startsWith('tennis-') && (
                        <div>
                          <label className="form-label">Tennis Settings</label>
                          <div className="text-xs text-muted-foreground">
                            Tennis-specific controls coming soon...
                          </div>
                        </div>
                      )}

                      {/* Position */}
                      <div>
                        <label className="form-label">Position</label>
                        <div className="text-xs text-muted-foreground">
                          X: {Math.round(selectedComponent.position.x)}, Y: {Math.round(selectedComponent.position.y)}
                        </div>
                      </div>

                      {/* Size */}
                      <div>
                        <label className="form-label">Size</label>
                        <div className="text-xs text-muted-foreground">
                          W: {selectedComponent.size.width}, H: {selectedComponent.size.height}
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
    </div>
  );
}

export default App;
