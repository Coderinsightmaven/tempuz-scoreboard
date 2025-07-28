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
  createNewScoreboard: (name: string, width: number, height: number, sport: SportType) => void;
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
  const baseComponent: ScoreboardComponent = {
    id: uuidv4(),
    type,
    position,
    size: { width: 100, height: 50 },
    rotation: 0,
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      borderRadius: 0,
      opacity: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    data: {},
    locked: false,
    visible: true,
    zIndex: 1,
  };

  // Customize based on component type
  switch (type) {
    case ComponentType.SCORE:
      return {
        ...baseComponent,
        size: { width: 80, height: 60 },
        style: { ...baseComponent.style, fontSize: 24, fontWeight: 'bold' },
        data: { value: 0, teamId: 'home' },
      };
    
    case ComponentType.TEAM_NAME:
      return {
        ...baseComponent,
        size: { width: 150, height: 40 },
        style: { ...baseComponent.style, fontSize: 18, fontWeight: 'bold' },
        data: { text: 'Team Name', teamId: 'home' },
      };
    
    case ComponentType.TIMER:
      return {
        ...baseComponent,
        size: { width: 120, height: 50 },
        style: { ...baseComponent.style, fontSize: 20, fontWeight: 'bold' },
        data: { value: '00:00', format: 'mm:ss' },
      };
    
    case ComponentType.PERIOD:
      return {
        ...baseComponent,
        size: { width: 60, height: 40 },
        style: { ...baseComponent.style, fontSize: 16 },
        data: { value: 1 },
      };
    
    case ComponentType.TEXT:
      return {
        ...baseComponent,
        size: { width: 100, height: 30 },
        data: { text: 'Text' },
      };
    
    case ComponentType.LOGO:
      return {
        ...baseComponent,
        size: { width: 80, height: 80 },
        data: { imageUrl: '', teamId: 'home' },
      };
    
    case ComponentType.RECTANGLE:
      return {
        ...baseComponent,
        size: { width: 100, height: 50 },
        style: { ...baseComponent.style, backgroundColor: '#f0f0f0' },
      };
    
    case ComponentType.CIRCLE:
      return {
        ...baseComponent,
        size: { width: 60, height: 60 },
        style: { ...baseComponent.style, borderRadius: 50, backgroundColor: '#f0f0f0' },
      };

    // Tennis-specific components
    case ComponentType.TENNIS_SET_SCORE:
      return {
        ...baseComponent,
        size: { width: 80, height: 40 },
        style: { ...baseComponent.style, fontSize: 20, fontWeight: 'bold' },
        data: { 
          text: '0 - 0',
          tennisData: { player1SetScore: 0, player2SetScore: 0 }
        },
      };

    case ComponentType.TENNIS_GAME_SCORE:
      return {
        ...baseComponent,
        size: { width: 100, height: 50 },
        style: { ...baseComponent.style, fontSize: 24, fontWeight: 'bold' },
        data: { 
          text: '0 - 0',
          tennisData: { player1GameScore: '0', player2GameScore: '0' }
        },
      };

    case ComponentType.TENNIS_CURRENT_GAME:
      return {
        ...baseComponent,
        size: { width: 80, height: 40 },
        style: { ...baseComponent.style, fontSize: 18, fontWeight: 'bold' },
        data: { 
          text: '0 - 0',
          tennisData: { player1CurrentGame: 0, player2CurrentGame: 0 }
        },
      };

    case ComponentType.TENNIS_SERVER_INDICATOR:
      return {
        ...baseComponent,
        size: { width: 20, height: 20 },
        style: { ...baseComponent.style, borderRadius: 50, backgroundColor: '#fbbf24' },
        data: { 
          text: '●',
          tennisData: { servingPlayer: 1 }
        },
      };

    case ComponentType.TENNIS_PLAYER_NAME:
      return {
        ...baseComponent,
        size: { width: 150, height: 35 },
        style: { ...baseComponent.style, fontSize: 16, fontWeight: 'bold' },
        data: { text: 'Player Name' },
      };

    case ComponentType.TENNIS_MATCH_STATUS:
      return {
        ...baseComponent,
        size: { width: 120, height: 30 },
        style: { ...baseComponent.style, fontSize: 14 },
        data: { text: 'In Progress' },
      };

    case ComponentType.TENNIS_TIEBREAK_SCORE:
      return {
        ...baseComponent,
        size: { width: 80, height: 40 },
        style: { ...baseComponent.style, fontSize: 18, fontWeight: 'bold', backgroundColor: '#ef4444', textColor: '#ffffff' },
        data: { 
          text: '0 - 0',
          tennisData: { 
            isTiebreak: true,
            tiebreakScore: { player1: 0, player2: 0 }
          }
        },
      };

    case ComponentType.BACKGROUND_COLOR:
      return {
        ...baseComponent,
        size: { width: 200, height: 100 },
        style: { 
          ...baseComponent.style, 
          backgroundColor: '#3b82f6',
          rgbColor: { r: 59, g: 130, b: 246, a: 1 },
          borderWidth: 0
        },
        data: { text: '' },
      };
    
    default:
      return baseComponent;
  }
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
    createNewScoreboard: (name: string, width: number, height: number, sport: SportType) =>
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
        components: config.components,
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