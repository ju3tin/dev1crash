import { Connection, Transaction, PublicKey } from '@solana/web3.js';

export class CrashGameClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // User functions
  async createUser(userPublicKey: string) {
    const response = await fetch(`${this.baseUrl}/api/helius/createUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPublicKey }),
    });
    return response.json();
  }

  async deposit(userPublicKey: string, amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPublicKey, amount }),
    });
    return response.json();
  }

  async withdraw(userPublicKey: string, amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPublicKey, amount }),
    });
    return response.json();
  }

  async placeBet(userPublicKey: string, gameId: string, amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/placeBet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPublicKey, gameId, amount }),
    });
    return response.json();
  }

  async claimPayout(userPublicKey: string, betId: string) {
    const response = await fetch(`${this.baseUrl}/api/helius/claimPayout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPublicKey, betId }),
    });
    return response.json();
  }

  // Read functions
  async getConfig() {
    const response = await fetch(`${this.baseUrl}/api/helius/getConfig`);
    return response.json();
  }

  async getUserBalance(userPublicKey: string) {
    const response = await fetch(
      `${this.baseUrl}/api/helius/getUserBalance?userPublicKey=${userPublicKey}`
    );
    return response.json();
  }

  async getGameState(gameId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/helius/getGameState?gameId=${gameId}`
    );
    return response.json();
  }

  async getBet(betId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/helius/getBet?betId=${betId}`
    );
    return response.json();
  }

  // Admin functions
  async createGame(multiplier: number, gameName: string, createdAt: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/createGame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ multiplier, gameName, createdAt }),
    });
    return response.json();
  }

  async resolveGame(gameId: string, crashed: boolean) {
    const response = await fetch(`${this.baseUrl}/api/helius/resolveGame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, crashed }),
    });
    return response.json();
  }

  async adminWithdraw(amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/adminWithdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return response.json();
  }

  async adminDepositBounty(amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/adminDepositBounty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return response.json();
  }

  async adminSetMinBet(amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/adminSetMinBet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return response.json();
  }

  async adminSetMaxBet(amount: number) {
    const response = await fetch(`${this.baseUrl}/api/helius/adminSetMaxBet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return response.json();
  }

  // Helper to sign and send transaction with wallet
  async signAndSendTransaction(
    transaction: string,
    wallet: any,
    connection: Connection
  ) {
    try {
      const tx = Transaction.from(Buffer.from(transaction, 'base64'));
      const signed = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}
