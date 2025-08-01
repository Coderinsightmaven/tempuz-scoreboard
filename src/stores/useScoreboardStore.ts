// src/stores/useScoreboardStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ScoreboardComponent, ScoreboardConfig, GameState, ComponentType, SportType } from '../types/scoreboard';
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

const createDefaultComponent = (
  type: ComponentType,
  position: { x: number; y: number }
): ScoreboardComponent => {
  // Set default size based on component type
  let defaultSize = { width: 100, height: 100 };
  let defaultData = { imageId: undefined, imageUrl: undefined, text: 'Sample Text' };
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
        text: 'Player Name',
        playerNumber: 1, // 1 or 2
        liveDataBinding: undefined
      };
      defaultZIndex = 6; // Above text but below interactive elements
      break;
    case ComponentType.TENNIS_GAME_SCORE:
      defaultSize = { width: 100, height: 80 }; // Square-ish for game scores
      defaultData = { 
        text: '0',
        playerNumber: 1, // 1 or 2
        liveDataBinding: undefined
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_SET_SCORE:
      defaultSize = { width: 80, height: 60 }; // Medium for set scores
      defaultData = { 
        text: '0',
        playerNumber: 1, // 1 or 2
        liveDataBinding: undefined
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_MATCH_SCORE:
      defaultSize = { width: 60, height: 50 }; // Small for match scores
      defaultData = { 
        text: '0',
        playerNumber: 1, // 1 or 2
        liveDataBinding: undefined
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_SERVE_SPEED:
      defaultSize = { width: 120, height: 60 }; // Medium size for serve speed
      defaultData = { 
        text: '', // Empty until live data arrives
        liveDataBinding: undefined
      };
      defaultZIndex = 6;
      break;
    case ComponentType.TENNIS_DETAILED_SET_SCORE:
      defaultSize = { width: 60, height: 50 }; // Small for individual set scores
      defaultData = { 
        text: '0',
        setNumber: 1, // 1, 2, or 3
        playerNumber: 1, // 1 or 2
        liveDataBinding: undefined
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

    // Configuration actions
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

    loadScoreboard: (config: ScoreboardConfig) =>
      set(() => ({
        config,
        components: (config.components || []).map(component => {
          // Ensure live data bindings are preserved when loading
          if (component.data && component.data.liveDataBinding) {
            console.log(`Loaded component ${component.id} with live data binding:`, component.data.liveDataBinding);
          }
          return component;
        }),
        isDirty: false,
        lastSaved: new Date(),
      })),

    updateScoreboardName: (name: string) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, name, updatedAt: new Date() },
          isDirty: true,
        };
      }),

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

    updateScoreboardBackground: (background) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, background, updatedAt: new Date() },
          isDirty: true,
        };
      }),

    updateGridSettings: (gridSettings) =>
      set((state) => {
        if (!state.config) return {};
        return {
          config: { ...state.config, gridSettings, updatedAt: new Date() },
          isDirty: true,
        };
      }),

    // Component actions
    addComponent: (type: ComponentType, position: { x: number; y: number }) => {
      const component = createDefaultComponent(type, position);
      set((state) => ({
        components: [...state.components, component],
        isDirty: true,
      }));
      return component.id;
    },

    removeComponent: (id: string) =>
      set((state) => ({
        components: state.components.filter(c => c.id !== id),
        isDirty: true,
      })),

    updateComponent: (id: string, updates: Partial<ScoreboardComponent>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
        isDirty: true,
      })),

    updateComponentPosition: (id: string, position: { x: number; y: number }) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, position } : c
        ),
        isDirty: true,
      })),

    updateComponentSize: (id: string, size: { width: number; height: number }) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, size } : c
        ),
        isDirty: true,
      })),

    updateComponentStyle: (id: string, style: Partial<ScoreboardComponent['style']>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, style: { ...c.style, ...style } } : c
        ),
        isDirty: true,
      })),

    updateComponentData: (id: string, data: Partial<ScoreboardComponent['data']>) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, data: { ...c.data, ...data } } : c
        ),
        isDirty: true,
      })),

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

    copyComponents: (componentIds: string[]) => {
      const state = get();
      const componentsToCopy = state.components.filter(c => componentIds.includes(c.id));
      return componentsToCopy;
    },

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

    lockComponent: (id: string, locked: boolean) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, locked } : c
        ),
        isDirty: true,
      })),

    toggleComponentVisibility: (id: string) =>
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, visible: !c.visible } : c
        ),
        isDirty: true,
      })),

    // Game state actions
    updateGameState: (gameState: GameState) =>
      set(() => ({ gameState })),

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

    updateTime: (timeRemaining: string) =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: { ...state.gameState, timeRemaining },
        };
      }),

    updatePeriod: (period: number) =>
      set((state) => {
        if (!state.gameState) return {};
        return {
          gameState: { ...state.gameState, period },
        };
      }),

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

    // Utility actions
    markDirty: () =>
      set(() => ({ isDirty: true })),

    markSaved: () =>
      set(() => ({ isDirty: false, lastSaved: new Date() })),

    clearScoreboard: () =>
      set(() => ({
        config: null,
        components: [],
        gameState: null,
        isDirty: false,
        lastSaved: null,
      })),

    getComponentById: (id: string) => {
      const state = get();
      return state.components.find(c => c.id === id);
    },

    getComponentsByType: (type: ComponentType) => {
      const state = get();
      return state.components.filter(c => c.type === type);
    },
  }))
); 