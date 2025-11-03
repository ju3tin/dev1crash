// src/types/crashGame.ts
// Generated from IDL - Types for Crash Game accounts

import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export interface Config {
  admin: PublicKey;
  vault: PublicKey;
}

export interface UserBalance {
  balance: BN;
  hasActiveBet: boolean;
}

export interface GameState {
  multiplier: BN;
  active: boolean;
  createdAt: BN;
  resolvedAt: BN;
  totalBets: BN;
  totalVolume: BN;
  gameName: string;
  admin: PublicKey;
  crashed: boolean;
  gameId: PublicKey;
}

export interface Bet {
  user: PublicKey;
  amount: BN;
  active: boolean;
  gameId: PublicKey;
  payoutAmount: BN;
  claimed: boolean;
}