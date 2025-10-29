// store/gameStore3.ts
import { create } from 'zustand';

export enum GameState {
  WAITING = 'waiting',
  RUNNING = 'running',
  CRASHED = 'crashed',
  STOPPED = 'stopped'
}

export interface Player {
  id: string;
  username: string;
  betAmount: number;
  cashOutMultiplier?: number;
  profit?: number;
}

export interface GameHistory {
  gameId: string;
  crashPoint: number;
  duration: number;
  timestamp: number;
}

export interface CrashGameData {
  gameId: string;
  multiplier: number;
  status: GameState;
  crashPoint: number;
  startTime: number;
  endTime?: number;
  countdown?: number;
  players: Player[];
  history: GameHistory[];
}

interface GameStore3 {
  // Current game state
  currentGame: CrashGameData | null;
  gameHistory: CrashGameData[];
  
  // Game controls
  startGame: () => Promise<void>;
  crashGame: () => Promise<void>;
  placeBet: (playerId: string, username: string, betAmount: number) => Promise<void>;
  cashOut: (playerId: string) => Promise<void>;
  
  // Data fetching
  fetchGameStatus: () => Promise<void>;
  fetchGameHistory: (limit?: number) => Promise<void>;
  
  // Local state updates
  setCurrentGame: (game: CrashGameData | null) => void;
  setGameHistory: (history: CrashGameData[]) => void;
  updateMultiplier: (multiplier: number) => void;
  
  // Computed values
  getTotalPlayers: () => number;
  getTotalBets: () => number;
  getActivePlayers: () => Player[];
}

export const useGameStore3 = create<GameStore3>((set, get) => ({
  currentGame: null,
  gameHistory: [],

  startGame: async () => {
    try {
      const response = await fetch('/api/crash/fake-api?action=start');
      const data = await response.json();
      
      if (data.success) {
        // Start polling for game updates
        const pollInterval = setInterval(async () => {
          const { fetchGameStatus } = get();
          await fetchGameStatus();
          
          const { currentGame } = get();
          if (currentGame?.status === GameState.CRASHED) {
            clearInterval(pollInterval);
          }
        }, 100);
        
        await get().fetchGameStatus();
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  },

  crashGame: async () => {
    try {
      const response = await fetch('/api/crash/fake-api?action=crash', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        await get().fetchGameStatus();
      }
    } catch (error) {
      console.error('Failed to crash game:', error);
    }
  },

  placeBet: async (playerId: string, username: string, betAmount: number) => {
    try {
      const response = await fetch('/api/crash/fake-api?action=place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, username, betAmount }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await get().fetchGameStatus();
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  },

  cashOut: async (playerId: string) => {
    try {
      const response = await fetch('/api/crash/fake-api?action=cash-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await get().fetchGameStatus();
      }
    } catch (error) {
      console.error('Failed to cash out:', error);
    }
  },

  fetchGameStatus: async () => {
    try {
      const response = await fetch('/api/crash/fake-api?action=status');
      const data = await response.json();
      
      if (data.gameId) {
        set({
          currentGame: {
            gameId: data.gameId,
            multiplier: data.multiplier,
            status: data.status as GameState,
            crashPoint: data.crashPoint,
            startTime: data.startTime,
            endTime: data.endTime,
            countdown: data.countdown,
            players: data.players || [],
            history: []
          }
        });
      } else {
        set({ currentGame: null });
      }
    } catch (error) {
      console.error('Failed to fetch game status:', error);
    }
  },

  fetchGameHistory: async (limit = 10) => {
    try {
      const response = await fetch(`/api/crash/fake-api?action=history&limit=${limit}`);
      const data = await response.json();
      
      set({ gameHistory: data.history || [] });
    } catch (error) {
      console.error('Failed to fetch game history:', error);
    }
  },

  setCurrentGame: (game) => set({ currentGame: game }),
  setGameHistory: (history) => set({ gameHistory: history }),
  updateMultiplier: (multiplier) => set((state) => ({
    currentGame: state.currentGame ? { ...state.currentGame, multiplier } : null
  })),

  getTotalPlayers: () => {
    const { currentGame } = get();
    return currentGame?.players.length || 0;
  },

  getTotalBets: () => {
    const { currentGame } = get();
    return currentGame?.players.reduce((total, player) => total + player.betAmount, 0) || 0;
  },

  getActivePlayers: () => {
    const { currentGame } = get();
    return currentGame?.players.filter(player => !player.cashOutMultiplier) || [];
  },
}));
