// types/User.ts
export interface User {
    _id: string;
    username: string;
    walletAddress?: string;
    balances: {
      SOL: number;
      CHIPPY: number;
      DEMO: number;
    };
  }
  