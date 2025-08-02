// src/stores/useManualTennisStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ManualTennisPlayer {
  name: string;
  country?: string;
  seed?: number;
}

export interface ManualTennisMatch {
  id: string;
  player1: ManualTennisPlayer;
  player2: ManualTennisPlayer;
  
  // Current score state
  score: {
    player1Sets: number;
    player2Sets: number;
    player1Games: number;
    player2Games: number;
    player1Points: string; // "0", "15", "30", "40", "A", "D"
    player2Points: string;
  };
  
  // Set history
  sets: {
    [key: string]: {
      player1: number;
      player2: number;
    };
  };
  
  // Match state
  currentSet: number;
  servingPlayer: 1 | 2;
  matchFormat: 'best-of-3' | 'best-of-5';
  matchStatus: 'not_started' | 'in_progress' | 'completed';
  
  // Tiebreak state
  isTiebreak: boolean;
  tiebreakScore?: {
    player1: number;
    player2: number;
  };
  
  // Match metadata
  tournament?: string;
  round?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ManualTennisState {
  currentMatch: ManualTennisMatch | null;
  isMatchActive: boolean;
}

interface ManualTennisActions {
  // Match management
  createNewMatch: (player1: ManualTennisPlayer, player2: ManualTennisPlayer, format?: 'best-of-3' | 'best-of-5') => void;
  updatePlayerInfo: (playerNumber: 1 | 2, updates: Partial<ManualTennisPlayer>) => void;
  startMatch: () => void;
  endMatch: () => void;
  resetMatch: () => void;
  
  // Scoring actions
  addPoint: (playerNumber: 1 | 2) => void;
  removePoint: (playerNumber: 1 | 2) => void;
  addGame: (playerNumber: 1 | 2) => void;
  removeGame: (playerNumber: 1 | 2) => void;
  setServe: (playerNumber: 1 | 2) => void;
  
  // Set management
  startNewSet: () => void;
  
  // Direct score editing
  setGameScore: (player1Games: number, player2Games: number) => void;
  setPointScore: (player1Points: string, player2Points: string) => void;
  setSetScore: (player1Sets: number, player2Sets: number) => void;
  
  // Tiebreak management
  startTiebreak: () => void;
  endTiebreak: () => void;
  addTiebreakPoint: (playerNumber: 1 | 2) => void;
  removeTiebreakPoint: (playerNumber: 1 | 2) => void;
  
  // Live data integration
  autoBindTennisComponents: () => void;
  
  // Utility
  getCurrentData: () => any; // Returns data compatible with TennisLiveData format
}

// Tennis scoring logic helpers
const POINT_VALUES = ['0', '15', '30', '40'];

const getNextPoint = (currentPoints: string): string => {
  const index = POINT_VALUES.indexOf(currentPoints);
  if (index === -1) return '0'; // Reset if in deuce/advantage
  return POINT_VALUES[Math.min(index + 1, 3)];
};

const getPreviousPoint = (currentPoints: string): string => {
  const index = POINT_VALUES.indexOf(currentPoints);
  if (index === -1) return '40'; // Go back to 40 if in deuce/advantage
  return POINT_VALUES[Math.max(index - 1, 0)];
};

const checkGameWin = (player1Points: string, player2Points: string): 1 | 2 | null => {
  // Simple win conditions
  if (player1Points === '40' && ['0', '15', '30'].includes(player2Points)) return 1;
  if (player2Points === '40' && ['0', '15', '30'].includes(player1Points)) return 2;
  
  // Advantage scenarios
  if (player1Points === 'A') return 1;
  if (player2Points === 'A') return 2;
  
  return null;
};

const handleDeuce = (player1Points: string, player2Points: string): { player1: string; player2: string } => {
  // If both at 40, it's deuce
  if (player1Points === '40' && player2Points === '40') {
    return { player1: 'D', player2: 'D' };
  }
  
  // From deuce, winning point gives advantage
  if (player1Points === 'D' && player2Points === 'D') {
    return { player1: player1Points, player2: player2Points }; // Stay at deuce
  }
  
  return { player1: player1Points, player2: player2Points };
};

const checkSetWin = (player1Games: number, player2Games: number): 1 | 2 | null => {
  // Standard set win: first to 6 games with 2-game lead
  if (player1Games >= 6 && player1Games - player2Games >= 2) return 1;
  if (player2Games >= 6 && player2Games - player1Games >= 2) return 2;
  
  // Tiebreak scenario: 6-6 goes to tiebreak, winner determined elsewhere
  if (player1Games === 7 && player2Games === 6) return 1;
  if (player2Games === 7 && player1Games === 6) return 2;
  
  return null;
};

const checkMatchWin = (player1Sets: number, player2Sets: number, format: 'best-of-3' | 'best-of-5'): 1 | 2 | null => {
  const setsToWin = format === 'best-of-3' ? 2 : 3;
  
  if (player1Sets >= setsToWin) return 1;
  if (player2Sets >= setsToWin) return 2;
  
  return null;
};

export const useManualTennisStore = create<ManualTennisState & ManualTennisActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentMatch: null,
    isMatchActive: false,

    // Match management
    createNewMatch: (player1, player2, format = 'best-of-3') => {
      const now = new Date();
      const newMatch: ManualTennisMatch = {
        id: `manual_${Date.now()}`,
        player1,
        player2,
        score: {
          player1Sets: 0,
          player2Sets: 0,
          player1Games: 0,
          player2Games: 0,
          player1Points: '0',
          player2Points: '0',
        },
        sets: {},
        currentSet: 1,
        servingPlayer: 1,
        matchFormat: format,
        matchStatus: 'not_started',
        isTiebreak: false,
        createdAt: now,
        updatedAt: now,
      };
      
      set({ currentMatch: newMatch, isMatchActive: false });
    },

    updatePlayerInfo: (playerNumber, updates) =>
      set((state) => {
        if (!state.currentMatch) return {};
        
        const playerKey = `player${playerNumber}` as const;
        return {
          currentMatch: {
            ...state.currentMatch,
            [playerKey]: { ...state.currentMatch[playerKey], ...updates },
            updatedAt: new Date(),
          },
        };
      }),

    startMatch: () =>
      set((state) => {
        if (!state.currentMatch) return {};
        
        return {
          isMatchActive: true,
          currentMatch: {
            ...state.currentMatch,
            matchStatus: 'in_progress',
            updatedAt: new Date(),
          },
        };
      }),

    endMatch: () =>
      set((state) => {
        if (!state.currentMatch) return {};
        
        return {
          isMatchActive: false,
          currentMatch: {
            ...state.currentMatch,
            matchStatus: 'completed',
            updatedAt: new Date(),
          },
        };
      }),

    resetMatch: () => {
      const { currentMatch } = get();
      if (!currentMatch) return;
      
      set({
        currentMatch: {
          ...currentMatch,
          score: {
            player1Sets: 0,
            player2Sets: 0,
            player1Games: 0,
            player2Games: 0,
            player1Points: '0',
            player2Points: '0',
          },
          sets: {},
          currentSet: 1,
          servingPlayer: 1,
          matchStatus: 'not_started',
          isTiebreak: false,
          tiebreakScore: undefined,
          updatedAt: new Date(),
        },
        isMatchActive: false,
      });
    },

    // Scoring actions
    addPoint: (playerNumber) => {
      const state = get();
      if (!state.currentMatch || !state.isMatchActive) return;
      
      const { currentMatch } = state;
      
      if (currentMatch.isTiebreak) {
        // Handle tiebreak scoring
        get().addTiebreakPoint(playerNumber);
        return;
      }
      
      const otherPlayer = playerNumber === 1 ? 2 : 1;
      const currentPlayerPoints = currentMatch.score[`player${playerNumber}Points`];
      const otherPlayerPoints = currentMatch.score[`player${otherPlayer}Points`];
      
      let newPlayerPoints = currentPlayerPoints;
      let newOtherPoints = otherPlayerPoints;
      
      // Handle deuce/advantage scenarios
      if (currentPlayerPoints === 'D' && otherPlayerPoints === 'D') {
        newPlayerPoints = 'A';
        newOtherPoints = 'D';
      } else if (currentPlayerPoints === 'D' && otherPlayerPoints === 'A') {
        newPlayerPoints = 'D';
        newOtherPoints = 'D';
      } else if (currentPlayerPoints === 'A') {
        // Player wins the game
        get().addGame(playerNumber);
        return;
      } else {
        newPlayerPoints = getNextPoint(currentPlayerPoints);
      }
      
      // Check for deuce situation
      if (newPlayerPoints === '40' && newOtherPoints === '40') {
        const deuceResult = handleDeuce(newPlayerPoints, newOtherPoints);
        newPlayerPoints = deuceResult[`player${playerNumber}`];
        newOtherPoints = deuceResult[`player${otherPlayer}`];
      }
      
      // Check for game win
      const gameWinner = checkGameWin(
        playerNumber === 1 ? newPlayerPoints : newOtherPoints,
        playerNumber === 1 ? newOtherPoints : newPlayerPoints
      );
      
      if (gameWinner === playerNumber) {
        get().addGame(playerNumber);
        return;
      }
      
      // Update points
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            [`player${playerNumber}Points`]: newPlayerPoints,
            [`player${otherPlayer}Points`]: newOtherPoints,
          },
          updatedAt: new Date(),
        } : null,
      }));
    },

    removePoint: (playerNumber) => {
      const state = get();
      if (!state.currentMatch || !state.isMatchActive) return;
      
      const { currentMatch } = state;
      
      if (currentMatch.isTiebreak) {
        get().removeTiebreakPoint(playerNumber);
        return;
      }
      
      const otherPlayer = playerNumber === 1 ? 2 : 1;
      const currentPlayerPoints = currentMatch.score[`player${playerNumber}Points`];
      const otherPlayerPoints = currentMatch.score[`player${otherPlayer}Points`];
      
      let newPlayerPoints = currentPlayerPoints;
      let newOtherPoints = otherPlayerPoints;
      
      // Handle deuce/advantage scenarios
      if (currentPlayerPoints === 'A') {
        newPlayerPoints = 'D';
        newOtherPoints = 'D';
      } else if (currentPlayerPoints === 'D' && otherPlayerPoints === 'A') {
        newPlayerPoints = 'D';
        newOtherPoints = 'D';
      } else if (currentPlayerPoints === 'D' && otherPlayerPoints === 'D') {
        newPlayerPoints = '40';
        newOtherPoints = '40';
      } else {
        newPlayerPoints = getPreviousPoint(currentPlayerPoints);
      }
      
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            [`player${playerNumber}Points`]: newPlayerPoints,
            [`player${otherPlayer}Points`]: newOtherPoints,
          },
          updatedAt: new Date(),
        } : null,
      }));
    },

    addGame: (playerNumber) => {
      const state = get();
      if (!state.currentMatch) return;
      
      const { currentMatch } = state;
      const otherPlayer = playerNumber === 1 ? 2 : 1;
      
      // Reset points
      const newScore = {
        ...currentMatch.score,
        [`player${playerNumber}Games`]: currentMatch.score[`player${playerNumber}Games`] + 1,
        player1Points: '0',
        player2Points: '0',
      };
      
      // Check for set win
      const setWinner = checkSetWin(
        newScore.player1Games,
        newScore.player2Games
      );
      
      if (setWinner) {
        // Player wins the set
        const newSets = {
          ...currentMatch.score,
          [`player${setWinner}Sets`]: currentMatch.score[`player${setWinner}Sets`] + 1,
        };
        
        // Save current set to history
        const newSetsHistory = {
          ...currentMatch.sets,
          [`set${currentMatch.currentSet}`]: {
            player1: newScore.player1Games,
            player2: newScore.player2Games,
          },
        };
        
        // Check for match win
        const matchWinner = checkMatchWin(
          newSets.player1Sets,
          newSets.player2Sets,
          currentMatch.matchFormat
        );
        
        if (matchWinner) {
          // Match is over
          set({
            currentMatch: {
              ...currentMatch,
              score: {
                ...newSets,
                player1Games: newScore.player1Games,
                player2Games: newScore.player2Games,
                player1Points: '0',
                player2Points: '0',
              },
              sets: newSetsHistory,
              matchStatus: 'completed',
              isTiebreak: false,
              tiebreakScore: undefined,
              updatedAt: new Date(),
            },
            isMatchActive: false,
          });
        } else {
          // Start new set
          set({
            currentMatch: {
              ...currentMatch,
              score: {
                ...newSets,
                player1Games: 0,
                player2Games: 0,
                player1Points: '0',
                player2Points: '0',
              },
              sets: newSetsHistory,
              currentSet: currentMatch.currentSet + 1,
              isTiebreak: false,
              tiebreakScore: undefined,
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Check for tiebreak (6-6)
        if (newScore.player1Games === 6 && newScore.player2Games === 6) {
          set({
            currentMatch: {
              ...currentMatch,
              score: newScore,
              isTiebreak: true,
              tiebreakScore: { player1: 0, player2: 0 },
              updatedAt: new Date(),
            },
          });
        } else {
          // Regular game win, continue set
          set({
            currentMatch: {
              ...currentMatch,
              score: newScore,
              servingPlayer: otherPlayer as 1 | 2, // Switch serve
              updatedAt: new Date(),
            },
          });
        }
      }
    },

    removeGame: (playerNumber) => {
      const state = get();
      if (!state.currentMatch) return;
      
      const currentGames = state.currentMatch.score[`player${playerNumber}Games`];
      if (currentGames <= 0) return;
      
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            [`player${playerNumber}Games`]: Math.max(0, currentGames - 1),
          },
          updatedAt: new Date(),
        } : null,
      }));
    },

    setServe: (playerNumber) =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          servingPlayer: playerNumber,
          updatedAt: new Date(),
        } : null,
      })),

    startNewSet: () => {
      const state = get();
      if (!state.currentMatch) return;
      
      set({
        currentMatch: {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            player1Games: 0,
            player2Games: 0,
            player1Points: '0',
            player2Points: '0',
          },
          currentSet: state.currentMatch.currentSet + 1,
          isTiebreak: false,
          tiebreakScore: undefined,
          updatedAt: new Date(),
        },
      });
    },

    // Direct score editing
    setGameScore: (player1Games, player2Games) =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            player1Games: Math.max(0, player1Games),
            player2Games: Math.max(0, player2Games),
          },
          updatedAt: new Date(),
        } : null,
      })),

    setPointScore: (player1Points, player2Points) =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            player1Points,
            player2Points,
          },
          updatedAt: new Date(),
        } : null,
      })),

    setSetScore: (player1Sets, player2Sets) =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          score: {
            ...state.currentMatch.score,
            player1Sets: Math.max(0, player1Sets),
            player2Sets: Math.max(0, player2Sets),
          },
          updatedAt: new Date(),
        } : null,
      })),

    // Tiebreak management
    startTiebreak: () =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          isTiebreak: true,
          tiebreakScore: { player1: 0, player2: 0 },
          score: {
            ...state.currentMatch.score,
            player1Points: '0',
            player2Points: '0',
          },
          updatedAt: new Date(),
        } : null,
      })),

    endTiebreak: () =>
      set((state) => ({
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          isTiebreak: false,
          tiebreakScore: undefined,
          updatedAt: new Date(),
        } : null,
      })),

    addTiebreakPoint: (playerNumber) => {
      const state = get();
      if (!state.currentMatch || !state.currentMatch.isTiebreak || !state.currentMatch.tiebreakScore) return;
      
      const currentScore = state.currentMatch.tiebreakScore[`player${playerNumber}`];
      const otherPlayerScore = state.currentMatch.tiebreakScore[`player${playerNumber === 1 ? 2 : 1}`];
      const newScore = currentScore + 1;
      
      // Check for tiebreak win (first to 7 with 2-point lead)
      if (newScore >= 7 && newScore - otherPlayerScore >= 2) {
        // Player wins the tiebreak and the set
        get().addGame(playerNumber);
        get().endTiebreak();
      } else {
        set((state) => ({
          currentMatch: state.currentMatch ? {
            ...state.currentMatch,
            tiebreakScore: {
              ...state.currentMatch.tiebreakScore!,
              [`player${playerNumber}`]: newScore,
            },
            updatedAt: new Date(),
          } : null,
        }));
      }
    },

    removeTiebreakPoint: (playerNumber) =>
      set((state) => {
        if (!state.currentMatch?.tiebreakScore) return {};
        
        const currentScore = state.currentMatch.tiebreakScore[`player${playerNumber}`];
        
        return {
          currentMatch: {
            ...state.currentMatch,
            tiebreakScore: {
              ...state.currentMatch.tiebreakScore,
              [`player${playerNumber}`]: Math.max(0, currentScore - 1),
            },
            updatedAt: new Date(),
          },
        };
      }),

    // Live data integration
    autoBindTennisComponents: async () => {
      try {
        const liveDataModule = await import('./useLiveDataStore');
        const liveDataStore = liveDataModule.useLiveDataStore.getState();
        
        // Find manual tennis connection
        const manualConnection = liveDataStore.connections.find(conn => conn.provider === 'manual_tennis');
        if (!manualConnection) {
          console.warn('No manual tennis connection found for auto-binding');
          return;
        }
        
        // Get scoreboard components
        const scoreboardModule = await import('./useScoreboardStore');
        const scoreboardStore = scoreboardModule.useScoreboardStore.getState();
        const { ComponentType } = await import('../types/scoreboard');
        
        // Find tennis components
        const tennisComponents = scoreboardStore.components.filter(component => 
          component.type === ComponentType.TENNIS_PLAYER_NAME ||
          component.type === ComponentType.TENNIS_GAME_SCORE ||
          component.type === ComponentType.TENNIS_SET_SCORE ||
          component.type === ComponentType.TENNIS_MATCH_SCORE ||
          component.type === ComponentType.TENNIS_SERVE_SPEED ||
          component.type === ComponentType.TENNIS_DETAILED_SET_SCORE
        );
        
        let boundCount = 0;
        
        // Bind each tennis component
        for (const component of tennisComponents) {
          const existingBinding = liveDataStore.getComponentBinding(component.id);
          if (!existingBinding) {
            const playerNumber = component.data.playerNumber || 1;
            let dataPath = '';
            
            switch (component.type) {
              case ComponentType.TENNIS_PLAYER_NAME:
                dataPath = `player${playerNumber}.name`;
                break;
              case ComponentType.TENNIS_GAME_SCORE:
                dataPath = `score.player${playerNumber}Points`;
                break;
              case ComponentType.TENNIS_SET_SCORE:
                dataPath = `score.player${playerNumber}Games`;
                break;
              case ComponentType.TENNIS_MATCH_SCORE:
                dataPath = `score.player${playerNumber}Sets`;
                break;
              case ComponentType.TENNIS_SERVE_SPEED:
                dataPath = 'serve.speed';
                break;
              case ComponentType.TENNIS_DETAILED_SET_SCORE:
                const setNumber = component.data.setNumber || 1;
                dataPath = `sets.set${setNumber}.player${playerNumber}`;
                break;
            }
            
            if (dataPath) {
              liveDataStore.addComponentBinding({
                componentId: component.id,
                connectionId: manualConnection.id,
                dataPath,
              });
              boundCount++;
            }
          }
        }
        
        // Set as active connection if components were bound
        if (boundCount > 0) {
          scoreboardStore.setActiveLiveDataConnection(manualConnection.id);
          console.log(`🎾 Auto-bound ${boundCount} tennis components to manual tennis data`);
        }
        
        // Activate the connection if not already active
        if (!manualConnection.isActive) {
          liveDataStore.activateConnection(manualConnection.id);
        }
        
      } catch (error) {
        console.error('Failed to auto-bind tennis components:', error);
      }
    },

    // Utility
    getCurrentData: () => {
      const state = get();
      if (!state.currentMatch) return null;
      
      const { currentMatch } = state;
      
      // Convert to TennisLiveData-compatible format
      return {
        matchId: currentMatch.id,
        player1: currentMatch.player1,
        player2: currentMatch.player2,
        score: currentMatch.score,
        sets: currentMatch.sets,
        matchStatus: currentMatch.matchStatus,
        servingPlayer: currentMatch.servingPlayer,
        currentSet: currentMatch.currentSet,
        isTiebreak: currentMatch.isTiebreak,
        tiebreakScore: currentMatch.tiebreakScore,
        tournament: currentMatch.tournament,
        round: currentMatch.round,
      };
    },
  }))
);

// Auto-sync manual tennis data to live data connections when match state changes
useManualTennisStore.subscribe(
  (state) => state.currentMatch,
  async (currentMatch) => {
    try {
      // Import live data store dynamically to avoid circular dependencies
      const liveDataModule = await import('./useLiveDataStore');
      const liveDataStore = liveDataModule.useLiveDataStore.getState();
      
      // Auto-create a manual tennis connection if none exists and we have a match
      if (currentMatch && !liveDataStore.connections.some(conn => conn.provider === 'manual_tennis')) {
        const connectionId = liveDataStore.createManualTennisConnection('Auto: Manual Tennis Match');
        
        // Auto-activate the connection and auto-bind tennis components
        setTimeout(async () => {
          liveDataStore.activateConnection(connectionId);
          
          // Auto-bind existing tennis components to this connection
          const scoreboardModule = await import('./useScoreboardStore');
          const scoreboardStore = scoreboardModule.useScoreboardStore.getState();
          const { ComponentType } = await import('../types/scoreboard');
          
          // Get all tennis components on the current scoreboard
          const tennisComponents = scoreboardStore.components.filter(component => 
            component.type === ComponentType.TENNIS_PLAYER_NAME ||
            component.type === ComponentType.TENNIS_GAME_SCORE ||
            component.type === ComponentType.TENNIS_SET_SCORE ||
            component.type === ComponentType.TENNIS_MATCH_SCORE ||
            component.type === ComponentType.TENNIS_SERVE_SPEED ||
            component.type === ComponentType.TENNIS_DETAILED_SET_SCORE
          );
          
          // Auto-bind tennis components that don't already have bindings
          for (const component of tennisComponents) {
            const existingBinding = liveDataStore.getComponentBinding(component.id);
            if (!existingBinding) {
              // Create appropriate data path based on component type
              const playerNumber = component.data.playerNumber || 1;
              let dataPath = '';
              
              switch (component.type) {
                case ComponentType.TENNIS_PLAYER_NAME:
                  dataPath = `player${playerNumber}.name`;
                  break;
                case ComponentType.TENNIS_GAME_SCORE:
                  dataPath = `score.player${playerNumber}Points`;
                  break;
                case ComponentType.TENNIS_SET_SCORE:
                  dataPath = `score.player${playerNumber}Games`;
                  break;
                case ComponentType.TENNIS_MATCH_SCORE:
                  dataPath = `score.player${playerNumber}Sets`;
                  break;
                case ComponentType.TENNIS_SERVE_SPEED:
                  dataPath = 'serve.speed';
                  break;
                case ComponentType.TENNIS_DETAILED_SET_SCORE:
                  const setNumber = component.data.setNumber || 1;
                  dataPath = `sets.set${setNumber}.player${playerNumber}`;
                  break;
              }
              
              if (dataPath) {
                console.log(`🎾 Auto-binding ${component.type} to manual tennis data: ${dataPath}`);
                liveDataStore.addComponentBinding({
                  componentId: component.id,
                  connectionId,
                  dataPath,
                });
              }
            }
          }
          
          // Set this as the active connection for the scoreboard
          if (tennisComponents.length > 0) {
            scoreboardStore.setActiveLiveDataConnection(connectionId);
            console.log(`🎾 Set manual tennis as active connection for scoreboard (${tennisComponents.length} components bound)`);
          }
        }, 100);
      }
      
      // Refresh live data for all manual tennis connections
      liveDataStore.refreshManualTennisData();
    } catch (error) {
      console.error('Failed to sync manual tennis data to live data:', error);
    }
  }
);