// src/stores/useAppStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MonitorInfo } from '../types/tauri';
import { TauriAPI } from '../lib/tauri';

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
  scoreboardWindowOpen: boolean;
  
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
  createScoreboardWindow: (width: number, height: number) => Promise<void>;
  closeScoreboardWindow: () => Promise<void>;
  
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
    scoreboardWindowOpen: false,
    
    isLoadingMonitors: false,
    isCreatingScoreboardWindow: false,
    
    lastError: null,
    
    settings: {
      autoSave: true,
      autoSaveInterval: 300000, // 5 minutes
      recentFiles: [],
      defaultCanvasSize: { width: 1920, height: 1080 },
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

    createScoreboardWindow: async (width: number, height: number) => {
      const state = get();
      if (!state.selectedMonitor) {
        set(() => ({ lastError: 'No monitor selected' }));
        return;
      }

      set(() => ({ isCreatingScoreboardWindow: true, lastError: null }));

      try {
        await TauriAPI.createScoreboardWindow(
          state.selectedMonitor.id,
          width,
          height,
          state.selectedMonitor.x,
          state.selectedMonitor.y
        );
        
        set(() => ({
          scoreboardWindowOpen: true,
          isCreatingScoreboardWindow: false,
        }));
      } catch (error) {
        set(() => ({
          isCreatingScoreboardWindow: false,
          lastError: error instanceof Error ? error.message : 'Failed to create scoreboard window',
        }));
      }
    },

    closeScoreboardWindow: async () => {
      try {
        await TauriAPI.closeScoreboardWindow();
        set(() => ({ scoreboardWindowOpen: false }));
      } catch (error) {
        set(() => ({
          lastError: error instanceof Error ? error.message : 'Failed to close scoreboard window',
        }));
      }
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