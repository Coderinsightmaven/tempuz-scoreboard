// src/stores/useLiveDataStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LiveDataConnection, TennisLiveData, LiveDataComponentBinding } from '../types/scoreboard';
import { v4 as uuidv4 } from 'uuid';
import { TauriAPI, LiveDataState } from '../lib/tauri';

interface LiveDataStoreState {
  connections: LiveDataConnection[];
  activeData: Record<string, TennisLiveData>;
  componentBindings: LiveDataComponentBinding[];
  isPolling: boolean;
  pollingIntervals: Record<string, NodeJS.Timeout>;
  isLoaded: boolean;
  lastError: string | null;
}

interface LiveDataActions {
  // Connection management
  addConnection: (connection: Omit<LiveDataConnection, 'id'>) => string;
  updateConnection: (id: string, updates: Partial<LiveDataConnection>) => void;
  removeConnection: (id: string) => void;
  activateConnection: (id: string) => void;
  deactivateConnection: (id: string) => void;
  getConnection: (id: string) => LiveDataConnection | undefined;
  
  // Data management
  updateLiveData: (connectionId: string, data: TennisLiveData) => void;
  getLiveData: (connectionId: string) => TennisLiveData | undefined;
  
  // Component binding
  addComponentBinding: (binding: LiveDataComponentBinding) => void;
  removeComponentBinding: (componentId: string) => void;
  updateComponentBinding: (componentId: string, updates: Partial<LiveDataComponentBinding>) => void;
  getComponentBinding: (componentId: string) => LiveDataComponentBinding | undefined;
  getComponentValue: (componentId: string) => any;
  
  // Polling control
  startPolling: (connectionId: string) => void;
  stopPolling: (connectionId: string) => void;
  stopAllPolling: () => void;
  
  // Error handling
  setConnectionError: (connectionId: string, error: string) => void;
  clearConnectionError: (connectionId: string) => void;
  
  // Persistence
  loadConnections: () => Promise<void>;
  saveConnections: () => Promise<void>;
}

const getValueFromPath = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Progressive mock tennis data for demo purposes
let mockMatchStartTime: number | null = null;

function getMockTennisDataProgressive(): TennisLiveData {
  // Progressive match simulation - starts at set 1 and progresses over time
  const now = Date.now();
  if (!mockMatchStartTime) mockMatchStartTime = now;
  const matchDuration = now - mockMatchStartTime;
  
  // Progress through sets over time (each set takes ~30 seconds for demo)
  let currentSet = 1;
  let setsWon = { player1: 0, player2: 0 };
  let setsData: any = {};
  
  // Determine current set based on time elapsed
  if (matchDuration > 30000) currentSet = 2; // After 30 seconds, start set 2
  if (matchDuration > 60000) currentSet = 3; // After 60 seconds, start set 3
  
  // Build sets data progressively
  for (let setNum = 1; setNum <= currentSet; setNum++) {
    if (setNum < currentSet) {
      // Completed sets
      const setWinner = setNum === 1 ? 1 : (setNum === 2 ? 2 : 1); // Alternate winners
      setsData[`set${setNum}`] = {
        player1: setWinner === 1 ? 6 : 4,
        player2: setWinner === 2 ? 6 : 4
      };
      if (setWinner === 1) setsWon.player1++;
      else setsWon.player2++;
    } else {
      // Current set in progress
      setsData[`set${setNum}`] = {
        player1: Math.floor(Math.random() * 7),
        player2: Math.floor(Math.random() * 7)
      };
    }
  }

  return {
    matchId: "live_match_001",
    player1: {
      name: "Novak Djokovic",
      country: "SRB",
      seed: 1
    },
    player2: {
      name: "Rafael Nadal", 
      country: "ESP",
      seed: 2
    },
    score: {
      player1Sets: setsWon.player1,
      player2Sets: setsWon.player2,
      player1Games: setsData[`set${currentSet}`]?.player1 || 0,
      player2Games: setsData[`set${currentSet}`]?.player2 || 0,
      player1Points: ["0", "15", "30", "40"][Math.floor(Math.random() * 4)],
      player2Points: ["0", "15", "30", "40"][Math.floor(Math.random() * 4)]
    },
    sets: setsData,
    serve: {
      speed: Math.floor(Math.random() * 40) + 100 + " MPH" // 100-140 MPH
    },
    matchStatus: currentSet >= 3 && (setsWon.player1 >= 2 || setsWon.player2 >= 2) ? "completed" : "in_progress",
    servingPlayer: Math.random() > 0.5 ? 1 : 2,
    currentSet: currentSet,
    isTiebreak: false
  } as TennisLiveData;
}

// Reset mock data progression for testing
function resetMockMatchProgression() {
  mockMatchStartTime = Date.now();
}

export const useLiveDataStore = create<LiveDataStoreState & LiveDataActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    connections: [],
    activeData: {},
    componentBindings: [],
    isPolling: false,
    pollingIntervals: {},
    isLoaded: false,
    lastError: null,

    // Connection management
    addConnection: (connectionData) => {
      const id = uuidv4();
      const now = new Date();
      const connection: LiveDataConnection = {
        id,
        ...connectionData,
        isActive: false,
        createdAt: now,
        lastUpdated: now,
      };
      
      set((state) => ({
        connections: [...state.connections, connection],
      }));
      
      // Auto-save after adding connection
      console.log('⏰ Scheduling auto-save after adding connection');
      setTimeout(() => {
        console.log('🔔 Auto-save triggered for new connection');
        get().saveConnections();
      }, 100);
      
      return id;
    },

    updateConnection: (id, updates) =>
      set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === id 
            ? { ...conn, ...updates, lastUpdated: new Date() }
            : conn
        ),
      })),

    removeConnection: (id) => {
      const { stopPolling } = get();
      stopPolling(id);
      
      set((state) => ({
        connections: state.connections.filter(conn => conn.id !== id),
        activeData: Object.fromEntries(
          Object.entries(state.activeData).filter(([key]) => key !== id)
        ),
        componentBindings: state.componentBindings.filter(
          binding => binding.connectionId !== id
        ),
      }));
      
      // Auto-save after removing connection
      setTimeout(() => get().saveConnections(), 100);
    },

    activateConnection: (id) => {
      const { startPolling } = get();
      
      set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === id ? { ...conn, isActive: true, lastError: undefined } : conn
        ),
      }));
      
      startPolling(id);
    },

    deactivateConnection: (id) => {
      const { stopPolling } = get();
      
      set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === id ? { ...conn, isActive: false } : conn
        ),
      }));
      
      stopPolling(id);
    },

    getConnection: (id) => {
      const state = get();
      return state.connections.find(conn => conn.id === id);
    },

    // Data management
    updateLiveData: (connectionId, data) =>
      set((state) => ({
        activeData: {
          ...state.activeData,
          [connectionId]: data,
        },
        connections: state.connections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, lastUpdated: new Date(), lastError: undefined }
            : conn
        ),
      })),

    getLiveData: (connectionId) => {
      const state = get();
      return state.activeData[connectionId];
    },

    // Component binding
    addComponentBinding: (binding) => {
      set((state) => ({
        componentBindings: [
          ...state.componentBindings.filter(b => b.componentId !== binding.componentId),
          binding,
        ],
      }));
      // Auto-save after adding binding
      setTimeout(() => get().saveConnections(), 100);
    },

    removeComponentBinding: (componentId) => {
      set((state) => ({
        componentBindings: state.componentBindings.filter(
          binding => binding.componentId !== componentId
        ),
      }));
      // Auto-save after removing binding
      setTimeout(() => get().saveConnections(), 100);
    },

    updateComponentBinding: (componentId, updates) => {
      set((state) => ({
        componentBindings: state.componentBindings.map(binding =>
          binding.componentId === componentId 
            ? { ...binding, ...updates }
            : binding
        ),
      }));
      // Auto-save after updating binding
      setTimeout(() => get().saveConnections(), 100);
    },

    getComponentBinding: (componentId) => {
      const state = get();
      return state.componentBindings.find(binding => binding.componentId === componentId);
    },

    getComponentValue: (componentId) => {
      const state = get();
      const binding = state.componentBindings.find(b => b.componentId === componentId);
      
      if (!binding) return undefined;
      
      const liveData = state.activeData[binding.connectionId];
      if (!liveData) return undefined;
      
      return getValueFromPath(liveData, binding.dataPath);
    },

    // Polling control
    startPolling: (connectionId) => {
      const state = get();
      const connection = state.connections.find(conn => conn.id === connectionId);
      
      if (!connection || state.pollingIntervals[connectionId]) return;
      
      // Polling function
      const pollData = async () => {
        try {
          let data;
          
          // Handle mock data locally for progressive simulation
          if (connection.provider === 'mock') {
            data = getMockTennisDataProgressive();
          } else {
            // Import TauriAPI dynamically to avoid circular dependencies
            const tauriModule = await import('../lib/tauri');
            data = await tauriModule.TauriAPI.fetchLiveData(connection.apiUrl, connection.apiKey);
          }
          
          get().updateLiveData(connectionId, data);
        } catch (error) {
          console.error('Failed to fetch live data:', error);
          get().setConnectionError(connectionId, error instanceof Error ? error.message : 'Unknown error');
        }
      };
      
      // Initial fetch
      pollData();
      
      // Set up polling interval
      const interval = setInterval(pollData, connection.pollInterval * 1000);
      
      set((state) => ({
        pollingIntervals: {
          ...state.pollingIntervals,
          [connectionId]: interval,
        },
        isPolling: true,
      }));
    },

    stopPolling: (connectionId) => {
      const state = get();
      const interval = state.pollingIntervals[connectionId];
      
      if (interval) {
        clearInterval(interval);
        
        const newIntervals = { ...state.pollingIntervals };
        delete newIntervals[connectionId];
        
        set({
          pollingIntervals: newIntervals,
          isPolling: Object.keys(newIntervals).length > 0,
        });
      }
    },

    stopAllPolling: () => {
      const state = get();
      
      Object.values(state.pollingIntervals).forEach(interval => {
        clearInterval(interval);
      });
      
      set({
        pollingIntervals: {},
        isPolling: false,
      });
    },

    // Error handling
    setConnectionError: (connectionId, error) =>
      set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, lastError: error, lastUpdated: new Date() }
            : conn
        ),
      })),

    clearConnectionError: (connectionId) =>
      set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, lastError: undefined }
            : conn
        ),
      })),

    // Persistence methods
    loadConnections: async () => {
      try {
        console.log('📥 Loading live data connections...');
        const data = await TauriAPI.loadLiveDataConnections();
        console.log('📋 Loaded data:', data);
        
        // Convert the loaded data to the store format
        const connections: LiveDataConnection[] = data.connections.map(conn => ({
          id: conn.id,
          name: conn.name,
          provider: conn.provider,
          apiUrl: conn.apiUrl,
          apiKey: conn.apiKey,
          pollInterval: conn.pollInterval,
          isActive: false, // Don't auto-start polling on load
          createdAt: new Date(conn.createdAt),
          updatedAt: conn.updatedAt ? new Date(conn.updatedAt) : undefined,
          lastUpdated: conn.lastUpdated ? new Date(conn.lastUpdated) : undefined,
          lastError: conn.lastError,
        }));

        const componentBindings: LiveDataComponentBinding[] = data.componentBindings.map(binding => ({
          componentId: binding.componentId,
          connectionId: binding.connectionId,
          dataPath: binding.dataPath,
          updateInterval: binding.updateInterval,
        }));

        set({
          connections,
          componentBindings,
          isLoaded: true,
          lastError: null,
        });

        console.log('✅ Live data connections loaded successfully:', connections.length, 'connections');
      } catch (error) {
        console.error('❌ Failed to load live data connections:', error);
        set({
          lastError: error instanceof Error ? error.message : 'Failed to load connections',
          isLoaded: true,
        });
      }
    },

    saveConnections: async () => {
      try {
        console.log('🔄 Starting saveConnections...');
        const state = get();
        
        console.log('📊 Current state:', {
          connectionsCount: state.connections.length,
          bindingsCount: state.componentBindings.length
        });
        
        // Convert store data to saveable format
        const saveData: LiveDataState = {
          connections: state.connections.map(conn => ({
            id: conn.id,
            name: conn.name,
            provider: conn.provider,
            apiUrl: conn.apiUrl,
            apiKey: conn.apiKey,
            pollInterval: conn.pollInterval,
            isActive: conn.isActive,
            createdAt: conn.createdAt ? conn.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: conn.updatedAt?.toISOString(),
            lastUpdated: conn.lastUpdated?.toISOString(),
            lastError: conn.lastError,
          })),
          componentBindings: state.componentBindings.map(binding => ({
            componentId: binding.componentId,
            connectionId: binding.connectionId,
            dataPath: binding.dataPath,
            updateInterval: binding.updateInterval,
          })),
        };

        console.log('💾 Calling TauriAPI.saveLiveDataConnections with data:', saveData);
        await TauriAPI.saveLiveDataConnections(saveData);
        console.log('✅ Live data connections saved successfully');
      } catch (error) {
        console.error('❌ Failed to save live data connections:', error);
        set({
          lastError: error instanceof Error ? error.message : 'Failed to save connections',
        });
      }
    },
  }))
);