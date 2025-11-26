/**
 * useScoreboardStore - Scoreboard design and component state management store.
 * 
 * Manages:
 * - Scoreboard configuration (name, dimensions, background, grid settings)
 * - Component list and manipulation (add, remove, update, duplicate, copy/paste)
 * - Component properties (position, size, style, data)
 * - Component layering (z-index, bring to front, send to back)
 * - Game state (scores, time, period)
 * - Dirty state tracking (whether scoreboard has unsaved changes)
 * 
 * This is the core store for the scoreboard designer functionality.
 */
// src/stores/useScoreboardStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ScoreboardComponent, ScoreboardConfig, GameState, ComponentType, ComponentData, SportType } from '../types/scoreboard';
import { v4 as uuidv4 } from 'uuid';

interface ScoreboardState {
  config: ScoreboardConfig | null;
  components: ScoreboardComponent[];
  gameState: GameState | null;
  selectedTemplate: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface ScoreboardActions {
  // Configuration
  createNewScoreboard: (name: string, width: number, height: number, sport?: SportType) => void;
  loadScoreboard: (config: ScoreboardConfig) => void;
  updateScoreboardName: (name: string) => void;
  updateScoreboardDimensions: (width: number, height: number) => void;
  updateScoreboardBackground: (background: { color: string; image?: string; opacity: number }) => void;
  updateGridSettings: (gridSettings: { enabled: boolean; size: number; snapToGrid: boolean }) => void;
  
  // Components
  addComponent: (type: ComponentType, position: { x: number; y: number }) => string;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ScoreboardComponent>) => void;
  updateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  updateComponentSize: (id: string, size: { width: number; height: number }) => void;
  updateComponentStyle: (id: string, style: Partial<ScoreboardComponent['style']>) => void;
  updateComponentData: (id: string, data: Partial<ScoreboardComponent['data']>) => void;
  duplicateComponent: (id: string) => string | null;
  copyComponents: (componentIds: string[]) => ScoreboardComponent[];
  pasteComponents: (components: ScoreboardComponent[], position?: { x: number; y: number }) => string[];
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  lockComponent: (id: string, locked: boolean) => void;
  toggleComponentVisibility: (id: string) => void;
  
  // Game State
  updateGameState: (gameState: GameState) => void;
  updateScore: (team: 'home' | 'away', score: number) => void;
  updateTime: (timeRemaining: string) => void;
  updatePeriod: (period: number) => void;
  toggleGameActive: () => void;
  resetGame: () => void;
  

  // Utility
  markDirty: () => void;
  markSaved: () => void;
  clearScoreboard: () => void;
  getComponentById: (id: string) => ScoreboardComponent | undefined;
  getComponentsByType: (type: ComponentType) => ScoreboardComponent[];
}

/**
 * Creates a new component with type-specific default values.
 * 
 * Each component type has appropriate defaults for:
 * - Size (width/height)
 * - Data (text, imageId, playerNumber, etc.)
 * - Z-index (layering order)
 * - Style (colors, borders, fonts)
 * 
 * @param type - The component type to create
 * @param position - Initial position on canvas (x, y coordinates)
 * @returns A new ScoreboardComponent with appropriate defaults
 */
const createDefaultComponent = (
  type: ComponentType,
  position: { x: number; y: number }
): ScoreboardComponent => {
  // Set default size based on component type
  let defaultSize = { width: 100, height: 100 };
  let defaultData: ComponentData = { imageId: undefined, imageUrl: undefined, text: 'Sample Text' };
  let defaultZIndex = 1;
  
  switch (type) {
    case ComponentType.BACKGROUND:
      defaultSize = { width: 800, height: 600 }; // Larger default for background
      defaultData = { imageId: undefined, imageUrl: undefined, text: 'Background' };
      defaultZIndex = 0; // Background should be behind everything
      break;
    case ComponentType.LOGO:
      defaultSize = { width: 150, height: 150 }; // Medium size for logos
      defaultData = { imageId: undefined, imageUrl: undefined, text: 'Logo' };
      defaultZIndex = 10; // Logo should be above background but can be layered
      break;
    case ComponentType.TEXT:
      defaultSize = { width: 200, height: 50 }; // Rectangle for text
      defaultData = { imageId: undefined, imageUrl: undefined, text: 'Sample Text' };
      defaultZIndex = 5; // Text in middle layer
      break;
    case ComponentType.TENNIS_PLAYER_NAME:
      defaultSize = { width: 300, height: 60 }; // Wide rectangle for player names
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: 'Player Name',
      };
      defaultZIndex = 6; // Above text but below interactive elements
      break;
    case ComponentType.TENNIS_GAME_SCORE:
      defaultSize = { width: 100, height: 80 }; // Square-ish for game scores
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '0',
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_SET_SCORE:
      defaultSize = { width: 80, height: 60 }; // Medium for set scores
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '0',
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_MATCH_SCORE:
      defaultSize = { width: 60, height: 50 }; // Small for match scores
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '0',
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_DETAILED_SET_SCORE:
      defaultSize = { width: 60, height: 50 }; // Small for individual set scores
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '0',
        playerNumber: 1,
        setNumber: 1,
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
      defaultSize = { width: 300, height: 60 }; // Wide rectangle for doubles player names
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '', // Let getDefaultTennisText handle the default
      };
      defaultZIndex = 6; // Above text but below interactive elements
      break;
    case ComponentType.TENNIS_SERVING_INDICATOR:
      defaultSize = { width: 50, height: 50 }; // Small square for serving indicator
      defaultData = {
        imageId: undefined,
        imageUrl: undefined,
        text: '', // Let getDefaultTennisText handle the default
      };
      defaultZIndex = 6;
      break;
  }

  const baseComponent: ScoreboardComponent = {
    id: uuidv4(),
    type,
    position,
    size: defaultSize,
    rotation: 0,
    style: {
      backgroundColor: (type === ComponentType.BACKGROUND || type === ComponentType.TEXT) ? 'transparent' : '#ffffff',
      borderColor: '#000000',
      borderWidth: (type === ComponentType.BACKGROUND || type === ComponentType.TEXT) ? 0 : 1,
      borderRadius: 0,
      opacity: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    data: defaultData,
    locked: false,
    visible: true,
    zIndex: defaultZIndex,
  };

  return baseComponent;
};

export const useScoreboardStore = create<ScoreboardState & ScoreboardActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    config: null,
    components: [],
    gameState: null,
    selectedTemplate: null,
    isDirty: false,
    lastSaved: null,

    // === Scoreboard Configuration ===
    
    /**
     * Creates a new scoreboard with the specified dimensions and name.
     * 
     * @param name - Name for the scoreboard
     * @param width - Canvas width in pixels
     * @param height - Canvas height in pixels
     * @param sport - Sport type (default: GENERIC)
     * 
     * Side effects:
     * - Creates new scoreboard config with unique ID
     * - Initializes empty components array
     * - Sets default grid settings
     * - Marks as clean (not dirty)
     */
    createNewScoreboard: (name: string, width: number, height: number, sport: SportType = SportType.GENERIC) =>
      set(() => {
        const now = new Date();
        const config: ScoreboardConfig = {
          id: uuidv4(),
          name,
          dimensions: { width, height },
          background: { color: '#000000', opacity: 1 },
          components: [],
          gridSettings: { enabled: true, size: 20, snapToGrid: true },
          sport,
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
        };
        return { config, components: [], isDirty: false, lastSaved: now };
      }),

    /**
     * Loads a scoreboard configuration into the designer.
     * Preserves live data bindings when loading components.
     * 
     * @param config - The scoreboard configuration to load
     * 
     * Side effects:
     * - Replaces current scoreboard config
     * - Loads all components from config
     * - Preserves live data bindings
     * - Marks as clean (not dirty)
     */
    loadScoreboard: (config: ScoreboardConfig) =>
      set(() => {
        const components = (config.components || []).map(component => {
          // Ensure live data bindings are preserved when loading
          if (component.data && component.data.liveDataBinding) {
            console.log(`Loaded component ${component.id} with live data binding:`, component.data.liveDataBinding);
          }
          return component;
        });
        
        return {
          config,
          components,
          isDirty: false,
          lastSaved: new Date(),
        };
      }),

    /**
     * Updates the scoreboard name.
     * 
     * @param name - New name for the scoreboard
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateScoreboardName: (name: string) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, name, updatedAt: new Date() },
          isDirty: true,
        };
      }),

    /**
     * Updates the scoreboard canvas dimensions.
     * 
     * @param width - New width in pixels
     * @param height - New height in pixels
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateScoreboardDimensions: (width: number, height: number) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: {
            ...state.config,
            dimensions: { width, height },
            updatedAt: new Date(),
          },
          isDirty: true,
        };
      }),

    /**
     * Updates the scoreboard background settings.
     * 
     * @param background - Background configuration (color, image, opacity)
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateScoreboardBackground: (background) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, background, updatedAt: new Date() },
          isDirty: true,
        };
      }),

    /**
     * Updates the grid settings (enabled, size, snap to grid).
     * 
     * @param gridSettings - Grid configuration object
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateGridSettings: (gridSettings) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, gridSettings, updatedAt: new Date() },
          isDirty: true,
        };
      }),

    // === Component Management ===
    
    /**
     * Adds a new component to the scoreboard.
     * Creates component with type-specific defaults.
     * 
     * @param type - The type of component to add
     * @param position - Initial position on canvas (x, y)
     * @returns The ID of the newly created component
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    addComponent: (type: ComponentType, position: { x: number; y: number }) => {
      const component = createDefaultComponent(type, position);
      set((state) => ({
        components: [...state.components, component],
        isDirty: true,
      }));
      return component.id;
    },

    /**
     * Removes a component from the scoreboard.
     * 
     * @param id - The ID of the component to remove
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    removeComponent: (id: string) =>
      set((state) => ({
        components: state.components.filter(c => c.id !== id),
        isDirty: true,
      })),

    /**
     * Updates a component with partial updates.
     * Merges updates with existing component properties.
     * 
     * @param id - The ID of the component to update
     * @param updates - Partial component object with properties to update
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateComponent: (id: string, updates: Partial<ScoreboardComponent>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
        isDirty: true,
      })),

    /**
     * Updates a component's position on the canvas.
     * 
     * @param id - The ID of the component to update
     * @param position - New position (x, y coordinates)
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateComponentPosition: (id: string, position: { x: number; y: number }) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, position } : c
        ),
        isDirty: true,
      })),

    /**
     * Updates a component's size.
     * 
     * @param id - The ID of the component to update
     * @param size - New size (width, height in pixels)
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateComponentSize: (id: string, size: { width: number; height: number }) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, size } : c
        ),
        isDirty: true,
      })),

    /**
     * Updates a component's style properties.
     * Merges style updates with existing style.
     * 
     * @param id - The ID of the component to update
     * @param style - Partial style object with properties to update
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateComponentStyle: (id: string, style: Partial<ScoreboardComponent['style']>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, style: { ...c.style, ...style } } : c
        ),
        isDirty: true,
      })),

    /**
     * Updates a component's data properties.
     * Merges data updates with existing data.
     * Used for component-specific data like text, imageId, playerNumber, etc.
     * 
     * @param id - The ID of the component to update
     * @param data - Partial data object with properties to update
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    updateComponentData: (id: string, data: Partial<ScoreboardComponent['data']>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, data: { ...c.data, ...data } } : c
        ),
        isDirty: true,
      })),

    /**
     * Duplicates a component, creating a copy with a new ID.
     * The duplicate is offset by 20px from the original.
     * 
     * @param id - The ID of the component to duplicate
     * @returns The ID of the new duplicate component, or null if component not found
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    duplicateComponent: (id: string) => {
      const state = get();
      const component = state.components.find(c => c.id === id);
      if (!component) return null;
      
      const duplicate: ScoreboardComponent = {
        ...component,
        id: uuidv4(),
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20,
        },
        zIndex: Math.max(...state.components.map(c => c.zIndex)) + 1,
      };
      
      set((state) => ({
        components: [...state.components, duplicate],
        isDirty: true,
      }));
      
      return duplicate.id;
    },

    /**
     * Copies components by ID, returning them for clipboard storage.
     * 
     * @param componentIds - Array of component IDs to copy
     * @returns Array of component objects (for clipboard)
     */
    copyComponents: (componentIds: string[]) => {
      const state = get();
      const componentsToCopy = state.components.filter(c => componentIds.includes(c.id));
      return componentsToCopy;
    },

    /**
     * Pastes components from clipboard onto the canvas.
     * Creates new components with new IDs and adjusted positions.
     * 
     * @param components - Array of components to paste (from clipboard)
     * @param position - Optional paste position (if provided, components are offset from this position)
     * @returns Array of new component IDs
     * 
     * Behavior:
     * - If position provided: offsets all components relative to first component's original position
     * - If no position: uses default 20px offset
     * - Assigns new z-index values above all existing components
     * 
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    pasteComponents: (components: ScoreboardComponent[], position?: { x: number; y: number }) => {
      if (components.length === 0) return [];
      
      const state = get();
      const newComponentIds: string[] = [];
      const maxZIndex = state.components.length > 0 ? Math.max(...state.components.map(c => c.zIndex)) : 0;
      
      const newComponents = components.map((component, index) => {
        const offset = position ? 
          { x: position.x - components[0].position.x, y: position.y - components[0].position.y } :
          { x: 20, y: 20 }; // Default offset for paste
        
        const newComponent = {
          ...component,
          id: uuidv4(),
          position: { 
            x: component.position.x + offset.x, 
            y: component.position.y + offset.y 
          },
          zIndex: maxZIndex + index + 1,
        };
        newComponentIds.push(newComponent.id);
        return newComponent;
      });
      
      set((state) => ({
        components: [...state.components, ...newComponents],
        isDirty: true,
      }));
      
      return newComponentIds;
    },

    /**
     * Brings a component to the front (highest z-index).
     * 
     * @param id - The ID of the component to bring forward
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    bringToFront: (id: string) =>
      set((state) => {
        const maxZIndex = Math.max(...state.components.map(c => c.zIndex));
        return {
          components: state.components.map(c =>
            c.id === id ? { ...c, zIndex: maxZIndex + 1 } : c
          ),
          isDirty: true,
        };
      }),

    /**
     * Sends a component to the back (lowest z-index).
     * 
     * @param id - The ID of the component to send backward
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    sendToBack: (id: string) =>
      set((state) => {
        const minZIndex = Math.min(...state.components.map(c => c.zIndex));
        return {
          components: state.components.map(c =>
            c.id === id ? { ...c, zIndex: minZIndex - 1 } : c
          ),
          isDirty: true,
        };
      }),

    /**
     * Locks or unlocks a component.
     * Locked components cannot be moved or resized.
     * 
     * @param id - The ID of the component to lock/unlock
     * @param locked - Whether the component should be locked
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    lockComponent: (id: string, locked: boolean) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, locked } : c
        ),
        isDirty: true,
      })),

    /**
     * Toggles component visibility (show/hide).
     * 
     * @param id - The ID of the component to toggle
     * Side effects: Marks scoreboard as dirty (unsaved changes)
     */
    toggleComponentVisibility: (id: string) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, visible: !c.visible } : c
        ),
        isDirty: true,
      })),

    // === Game State Management ===
    
    /**
     * Updates the entire game state.
     * 
     * @param gameState - Complete game state object
     */
    updateGameState: (gameState: GameState) =>
      set(() => ({ gameState })),

    /**
     * Updates the score for a team.
     * 
     * @param team - Either 'home' or 'away'
     * @param score - New score value
     * Note: Only updates if gameState exists
     */
    updateScore: (team: 'home' | 'away', score: number) =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: {
            ...state.gameState,
            [`${team}Score`]: score,
          },
        };
      }),

    /**
     * Updates the time remaining in the game.
     * 
     * @param timeRemaining - Time string (e.g., "10:30")
     * Note: Only updates if gameState exists
     */
    updateTime: (timeRemaining: string) =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: { ...state.gameState, timeRemaining },
        };
      }),

    /**
     * Updates the current period/quarter.
     * 
     * @param period - Period number
     * Note: Only updates if gameState exists
     */
    updatePeriod: (period: number) =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: { ...state.gameState, period },
        };
      }),

    /**
     * Toggles whether the game is currently active (playing/paused).
     * Note: Only updates if gameState exists
     */
    toggleGameActive: () =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: {
            ...state.gameState,
            isGameActive: !state.gameState.isGameActive,
          },
        };
      }),

    /**
     * Resets the game state to initial values.
     * Sets scores to 0, period to 1, time to "00:00", and game to inactive.
     * Note: Only updates if gameState exists
     */
    resetGame: () =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: {
            ...state.gameState,
            homeScore: 0,
            awayScore: 0,
            period: 1,
            timeRemaining: '00:00',
            isGameActive: false,
            metadata: {},
          },
        };
      }),


    // === Utility Functions ===
    
    /**
     * Marks the scoreboard as having unsaved changes (dirty).
     * Used to track when the scoreboard needs to be saved.
     */
    markDirty: () =>
      set(() => ({ isDirty: true })),

    /**
     * Marks the scoreboard as saved (clean).
     * Updates the lastSaved timestamp.
     */
    markSaved: () =>
      set(() => ({ isDirty: false, lastSaved: new Date() })),

    /**
     * Clears the current scoreboard, resetting to empty state.
     * Removes config, components, and game state.
     */
    clearScoreboard: () =>
      set(() => ({
        config: null,
        components: [],
        gameState: null,
        isDirty: false,
        lastSaved: null,
      })),

    /**
     * Gets a component by its ID.
     * 
     * @param id - The component ID to find
     * @returns The component if found, undefined otherwise
     */
    getComponentById: (id: string) => {
      const state = get();
      return state.components.find(c => c.id === id);
    },

    /**
     * Gets all components of a specific type.
     * 
     * @param type - The component type to filter by
     * @returns Array of components matching the type
     */
    getComponentsByType: (type: ComponentType) => {
      const state = get();
      return state.components.filter(c => c.type === type);
    },
  }))
); 