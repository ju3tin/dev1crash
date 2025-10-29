// utils/crashApi.ts
import { CrashGameData, Player, GameHistory } from '@/store/gameStore3';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StartGameResponse {
  gameId: string;
  status: string;
  crashPoint: number;
  startTime: number;
  message: string;
}

export interface GameStatusResponse {
  gameId: string;
  status: string;
  multiplier: number;
  crashPoint: number;
  startTime: number;
  endTime?: number;
  players: Player[];
  duration: number;
}

export interface GameHistoryResponse {
  history: CrashGameData[];
  total: number;
}

export interface PlaceBetRequest {
  playerId: string;
  username: string;
  betAmount: number;
}

export interface CashOutRequest {
  playerId: string;
}

// API base URL
const API_BASE = '/api/crash/fake-api';

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API call failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Crash game API functions
export const crashApi = {
  // Start a new game
  startGame: async (): Promise<ApiResponse<StartGameResponse>> => {
    return apiCall<StartGameResponse>('?action=start', { method: 'POST' });
  },

  // Get current game status
  getGameStatus: async (): Promise<ApiResponse<GameStatusResponse>> => {
    return apiCall<GameStatusResponse>('?action=status');
  },

  // Manually crash the game
  crashGame: async (): Promise<ApiResponse<{ gameId: string; finalMultiplier: number; crashPoint: number; duration: number; message: string }>> => {
    return apiCall('?action=crash', { method: 'POST' });
  },

  // Get game history
  getGameHistory: async (limit = 10): Promise<ApiResponse<GameHistoryResponse>> => {
    return apiCall<GameHistoryResponse>(`?action=history&limit=${limit}`);
  },

  // Place a bet
  placeBet: async (betData: PlaceBetRequest): Promise<ApiResponse<{ player: Player; message: string }>> => {
    return apiCall('?action=place-bet', {
      method: 'POST',
      body: JSON.stringify(betData),
    });
  },

  // Cash out
  cashOut: async (cashOutData: CashOutRequest): Promise<ApiResponse<{ player: Player; message: string }>> => {
    return apiCall('?action=cash-out', {
      method: 'POST',
      body: JSON.stringify(cashOutData),
    });
  },
};

// Utility functions for game data
export const gameUtils = {
  // Calculate potential profit
  calculateProfit: (betAmount: number, multiplier: number): number => {
    return (betAmount * multiplier) - betAmount;
  },

  // Format multiplier for display
  formatMultiplier: (multiplier: number): string => {
    return `${multiplier.toFixed(2)}x`;
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  },

  // Get game duration in seconds
  getGameDuration: (startTime: number, endTime?: number): number => {
    const end = endTime || Date.now();
    return Math.floor((end - startTime) / 1000);
  },

  // Check if player can cash out
  canCashOut: (player: Player): boolean => {
    return !player.cashOutMultiplier;
  },

  // Get player status
  getPlayerStatus: (player: Player): 'active' | 'cashed_out' | 'busted' => {
    if (player.cashOutMultiplier) {
      return 'cashed_out';
    }
    return 'active';
  },

  // Calculate house edge (simplified)
  calculateHouseEdge: (crashPoint: number): number => {
    // Simplified house edge calculation
    return Math.max(0, 1 - (1 / crashPoint));
  },
};

// WebSocket-like polling for real-time updates
export class GamePoller {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private onUpdate: (data: GameStatusResponse) => void;
  private onError: (error: string) => void;

  constructor(
    onUpdate: (data: GameStatusResponse) => void,
    onError: (error: string) => void
  ) {
    this.onUpdate = onUpdate;
    this.onError = onError;
  }

  start(intervalMs = 100): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.intervalId = setInterval(async () => {
      const response = await crashApi.getGameStatus();
      
      if (response.success && response.data) {
        this.onUpdate(response.data);
        
        // Stop polling if game is crashed
        if (response.data.status === 'crashed') {
          this.stop();
        }
      } else if (response.error) {
        this.onError(response.error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  isActive(): boolean {
    return this.isPolling;
  }
}
