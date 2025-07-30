// src/stores/useAppStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MonitorInfo } from '../types/tauri';
import { ScoreboardInstance } from '../types/scoreboard';
import { TauriAPI } from '../lib/tauri';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  // UI State
  theme: Theme;
  sidebarOpen: boolean;
  propertyPanelOpen: boolean;
  toolbarCompact: boolean;
  
  // Monitor Management
  monitors: MonitorInfo[];
  selectedMonitor: MonitorInfo | null;
  scoreboardInstances: ScoreboardInstance[];
  
  // Loading States
  isLoadingMonitors: boolean;
  isCreatingScoreboardWindow: boolean;
  
  // Error States
  lastError: string | null;
  
  // App Settings
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    recentFiles: string[];
    defaultCanvasSize: { width: number; height: number };
    defaultGridSize: number;
    showWelcomeScreen: boolean;
    enableHotkeys: boolean;
  };
}

interface AppActions {
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // UI
  toggleSidebar: () => void;
  togglePropertyPanel: () => void;
  toggleToolbarCompact: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPropertyPanelOpen: (open: boolean) => void;
  
  // Monitor Management
  loadMonitors: () => Promise<void>;
  selectMonitor: (monitor: MonitorInfo | null) => void;
  
  // Multiple Scoreboard Management
  createScoreboardInstance: (
    name: string,
    width: number,
    height: number,
    offsetX?: number,
    offsetY?: number,
    savedScoreboardId?: string
  ) => Promise<string | null>;
  closeScoreboardInstance: (instanceId: string) => Promise<void>;
  closeAllScoreboardInstances: () => Promise<void>;
  updateScoreboardInstancePosition: (
    instanceId: string,
    offsetX: number,
    offsetY: number
  ) => Promise<void>;
  updateScoreboardInstanceSize: (
    instanceId: string,
    width: number,
    height: number
  ) => Promise<void>;
  getScoreboardInstance: (instanceId: string) => ScoreboardInstance | undefined;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Settings
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  addRecentFile: (filepath: string) => void;
  clearRecentFiles: () => void;
  
  // Initialization
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    theme: 'system',
    sidebarOpen: true,
    propertyPanelOpen: true,
    toolbarCompact: false,
    
    monitors: [],
    selectedMonitor: null,
    scoreboardInstances: [],
    
    isLoadingMonitors: false,
    isCreatingScoreboardWindow: false,
    
    lastError: null,
    
    settings: {
      autoSave: true,
      autoSaveInterval: 300000, // 5 minutes
      recentFiles: [],
      defaultCanvasSize: { width: 800, height: 600 },
      defaultGridSize: 20,
      showWelcomeScreen: true,
      enableHotkeys: true,
    },

    // Theme actions
    setTheme: (theme: Theme) =>
      set(() => ({ theme })),

    toggleTheme: () =>
      set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

    // UI actions
    toggleSidebar: () =>
      set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    togglePropertyPanel: () =>
      set((state) => ({ propertyPanelOpen: !state.propertyPanelOpen })),

    toggleToolbarCompact: () =>
      set((state) => ({ toolbarCompact: !state.toolbarCompact })),

    setSidebarOpen: (open: boolean) =>
      set(() => ({ sidebarOpen: open })),

    setPropertyPanelOpen: (open: boolean) =>
      set(() => ({ propertyPanelOpen: open })),

    // Monitor management
    loadMonitors: async () => {
      set(() => ({ isLoadingMonitors: true, lastError: null }));
      
      try {
        const monitors = await TauriAPI.getMonitors();
        set(() => ({
          monitors,
          isLoadingMonitors: false,
          selectedMonitor: monitors.length > 0 ? monitors[0] : null,
        }));
      } catch (error) {
        set(() => ({
          isLoadingMonitors: false,
          lastError: error instanceof Error ? error.message : 'Failed to load monitors',
        }));
      }
    },

    selectMonitor: (monitor: MonitorInfo | null) =>
      set(() => ({ selectedMonitor: monitor })),

    // Multiple Scoreboard Management
    createScoreboardInstance: async (
      name: string,
      width: number,
      height: number,
      offsetX: number = 0,
      offsetY: number = 0,
      savedScoreboardId?: string
    ) => {
      const state = get();
      if (!state.selectedMonitor) {
        set(() => ({ lastError: 'No monitor selected' }));
        return null;
      }

      set(() => ({ isCreatingScoreboardWindow: true, lastError: null }));

      try {
        const instanceId = uuidv4();
        const windowId = `scoreboard_${instanceId}`;
        
        // Get current scoreboard data from the store, or load saved scoreboard data if provided
        let scoreboardData = null;
        
        // Import the scoreboard store
        const { useScoreboardStore } = await import('./useScoreboardStore');
        const scoreboardStoreState = useScoreboardStore.getState();
        
        if (savedScoreboardId) {
          try {
            const savedScoreboards = await TauriAPI.listScoreboards();
            const savedScoreboard = savedScoreboards.find(sb => sb.id === savedScoreboardId);
            if (savedScoreboard) {
              scoreboardData = savedScoreboard.data;
              // Use the saved scoreboard's name if no custom name provided
              if (!name || name === savedScoreboard.name) {
                name = `${savedScoreboard.name} Display`;
              }
            }
          } catch (error) {
            console.warn('Failed to load saved scoreboard data:', error);
          }
        } else if (scoreboardStoreState.config) {
          // Use current scoreboard data
          scoreboardData = {
            config: scoreboardStoreState.config,
            components: scoreboardStoreState.components,
            gameState: scoreboardStoreState.gameState
          };
        }
        
        await TauriAPI.createScoreboardWindow(
          windowId,
          state.selectedMonitor.id,
          width,
          height,
          state.selectedMonitor.x,
          state.selectedMonitor.y,
          offsetX,
          offsetY,
          scoreboardData
        );

        const newInstance: ScoreboardInstance = {
          id: instanceId,
          windowId,
          name,
          monitorId: state.selectedMonitor.id,
          position: {
            x: state.selectedMonitor.x,
            y: state.selectedMonitor.y,
            offsetX,
            offsetY,
          },
          size: { width, height },
          isActive: true,
          createdAt: new Date(),
          scoreboardData, // Store the saved scoreboard data with the instance
        };
        
        set((state) => ({
          scoreboardInstances: [...state.scoreboardInstances, newInstance],
          isCreatingScoreboardWindow: false,
        }));

        return instanceId;
      } catch (error) {
        set(() => ({
          isCreatingScoreboardWindow: false,
          lastError: error instanceof Error ? error.message : 'Failed to create scoreboard window',
        }));
        return null;
      }
    },

    closeScoreboardInstance: async (instanceId: string) => {
      const state = get();
      const instance = state.scoreboardInstances.find(inst => inst.id === instanceId);
      
      if (!instance) {
        set(() => ({ lastError: 'Scoreboard instance not found' }));
        return;
      }

      try {
        await TauriAPI.closeScoreboardWindow(instance.windowId);
        set((state) => ({
          scoreboardInstances: state.scoreboardInstances.filter(inst => inst.id !== instanceId),
        }));
      } catch (error) {
        set(() => ({
          lastError: error instanceof Error ? error.message : 'Failed to close scoreboard window',
        }));
      }
    },

    closeAllScoreboardInstances: async () => {
      try {
        await TauriAPI.closeAllScoreboardWindows();
        set(() => ({ scoreboardInstances: [] }));
      } catch (error) {
        set(() => ({
          lastError: error instanceof Error ? error.message : 'Failed to close all scoreboard windows',
        }));
      }
    },

    updateScoreboardInstancePosition: async (
      instanceId: string,
      offsetX: number,
      offsetY: number
    ) => {
      const state = get();
      const instance = state.scoreboardInstances.find(inst => inst.id === instanceId);
      
      if (!instance) {
        set(() => ({ lastError: 'Scoreboard instance not found' }));
        return;
      }

      try {
        await TauriAPI.updateScoreboardWindowPosition(
          instance.windowId,
          instance.position.x,
          instance.position.y,
          offsetX,
          offsetY
        );

        set((state) => ({
          scoreboardInstances: state.scoreboardInstances.map(inst =>
            inst.id === instanceId
              ? {
                  ...inst,
                  position: { ...inst.position, offsetX, offsetY }
                }
              : inst
          ),
        }));
      } catch (error) {
        set(() => ({
          lastError: error instanceof Error ? error.message : 'Failed to update scoreboard position',
        }));
      }
    },

    updateScoreboardInstanceSize: async (
      instanceId: string,
      width: number,
      height: number
    ) => {
      const state = get();
      const instance = state.scoreboardInstances.find(inst => inst.id === instanceId);
      
      if (!instance) {
        set(() => ({ lastError: 'Scoreboard instance not found' }));
        return;
      }

      try {
        await TauriAPI.updateScoreboardWindowSize(instance.windowId, width, height);

        set((state) => ({
          scoreboardInstances: state.scoreboardInstances.map(inst =>
            inst.id === instanceId
              ? { ...inst, size: { width, height } }
              : inst
          ),
        }));
      } catch (error) {
        set(() => ({
          lastError: error instanceof Error ? error.message : 'Failed to update scoreboard size',
        }));
      }
    },

    getScoreboardInstance: (instanceId: string) => {
      const state = get();
      return state.scoreboardInstances.find(inst => inst.id === instanceId);
    },

    // Error handling
    setError: (error: string | null) =>
      set(() => ({ lastError: error })),

    clearError: () =>
      set(() => ({ lastError: null })),

    // Settings
    updateSettings: (newSettings: Partial<AppState['settings']>) =>
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

    addRecentFile: (filepath: string) =>
      set((state) => {
        const recentFiles = [
          filepath,
          ...state.settings.recentFiles.filter(f => f !== filepath)
        ].slice(0, 10); // Keep only 10 recent files
        
        return {
          settings: { ...state.settings, recentFiles }
        };
      }),

    clearRecentFiles: () =>
      set((state) => ({
        settings: { ...state.settings, recentFiles: [] }
      })),

    // Initialization
    initializeApp: async () => {
      const { loadMonitors } = get();
      
      // Load saved settings from localStorage if available
      try {
        const savedSettings = localStorage.getItem('scoreboard-app-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          set((state) => ({
            settings: { ...state.settings, ...parsedSettings }
          }));
        }
      } catch (error) {
        console.warn('Failed to load saved settings:', error);
      }

      // Load theme from localStorage
      try {
        const savedTheme = localStorage.getItem('scoreboard-app-theme') as Theme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          set(() => ({ theme: savedTheme }));
        }
      } catch (error) {
        console.warn('Failed to load saved theme:', error);
      }

      // Load monitors
      await loadMonitors();
    },
  }))
);

// Subscribe to settings changes and save to localStorage
useAppStore.subscribe(
  (state) => state.settings,
  (settings) => {
    try {
      localStorage.setItem('scoreboard-app-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
);

// Subscribe to theme changes and save to localStorage
useAppStore.subscribe(
  (state) => state.theme,
  (theme) => {
    try {
      localStorage.setItem('scoreboard-app-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }
); 