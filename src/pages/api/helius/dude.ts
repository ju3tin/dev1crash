import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Keypair,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
  import { AnchorProvider, Program, BN, Wallet } from '@coral-xyz/anchor';
  import * as borsh from '@coral-xyz/borsh';
  
  // Your IDL
  const IDL = {
    "version": "0.1.0",
    "name": "crash_game",
    "instructions": [
      {
        "name": "initialize",
        "accounts": [
          {"name": "config", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "admin", "type": "publicKey"}]
      },
      {
        "name": "createUser",
        "accounts": [
          {"name": "user", "isMut": true, "isSigner": false},
          {"name": "userWallet", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": []
      },
      {
        "name": "deposit",
        "accounts": [
          {"name": "user", "isMut": true, "isSigner": false},
          {"name": "userWallet", "isMut": true, "isSigner": true},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "withdraw",
        "accounts": [
          {"name": "user", "isMut": true, "isSigner": false},
          {"name": "userWallet", "isMut": true, "isSigner": true},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "createGame",
        "accounts": [
          {"name": "gameState", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "multiplier", "type": "u64"},
          {"name": "gameName", "type": "string"},
          {"name": "createdAt", "type": "u32"}
        ]
      },
      {
        "name": "placeBet",
        "accounts": [
          {"name": "bet", "isMut": true, "isSigner": false},
          {"name": "userBalance", "isMut": true, "isSigner": false},
          {"name": "gameState", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false},
          {"name": "config", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "resolveGame",
        "accounts": [
          {"name": "gameState", "isMut": true, "isSigner": false},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "crashed", "type": "bool"}]
      },
      {
        "name": "claimPayout",
        "accounts": [
          {"name": "bet", "isMut": true, "isSigner": false},
          {"name": "userBalance", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true}
        ],
        "args": []
      },
      {
        "name": "adminWithdraw",
        "accounts": [
          {"name": "config", "isMut": false, "isSigner": false},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "adminDepositBounty",
        "accounts": [
          {"name": "config", "isMut": false, "isSigner": false},
          {"name": "vault", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "adminSetMinBet",
        "accounts": [
          {"name": "config", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      },
      {
        "name": "adminSetMaxBet",
        "accounts": [
          {"name": "config", "isMut": true, "isSigner": false},
          {"name": "signer", "isMut": true, "isSigner": true}
        ],
        "args": [{"name": "amount", "type": "u64"}]
      }
    ],
    "accounts": [
      {
        "name": "Config",
        "type": {
          "kind": "struct",
          "fields": [
            {"name": "admin", "type": "publicKey"},
            {"name": "vault", "type": "publicKey"},
            {"name": "minBet", "type": "u64"},
            {"name": "maxBet", "type": "u64"}
          ]
        }
      },
      {
        "name": "UserBalance",
        "type": {
          "kind": "struct",
          "fields": [
            {"name": "balance", "type": "u64"},
            {"name": "hasActiveBet", "type": "bool"}
          ]
        }
      },
      {
        "name": "GameState",
        "type": {
          "kind": "struct",
          "fields": [
            {"name": "multiplier", "type": "u64"},
            {"name": "active", "type": "bool"},
            {"name": "createdAt", "type": "i64"},
            {"name": "resolvedAt", "type": "i64"},
            {"name": "totalBets", "type": "u64"},
            {"name": "totalVolume", "type": "u64"},
            {"name": "gameName", "type": "string"},
            {"name": "admin", "type": "publicKey"},
            {"name": "crashed", "type": "bool"},
            {"name": "gameId", "type": "publicKey"}
          ]
        }
      },
      {
        "name": "Bet",
        "type": {
          "kind": "struct",
          "fields": [
            {"name": "user", "type": "publicKey"},
            {"name": "amount", "type": "u64"},
            {"name": "active", "type": "bool"},
            {"name": "gameId", "type": "publicKey"},
            {"name": "payoutAmount", "type": "u64"},
            {"name": "claimed", "type": "bool"},
            {"name": "multiplier", "type": "u64"}
          ]
        }
      }
    ],
    "errors": [
      {"code": 6000, "name": "InvalidAmount", "msg": "Invalid amount"},
      {"code": 6001, "name": "InsufficientBalance", "msg": "Insufficient balance"},
      {"code": 6002, "name": "GameNotActive", "msg": "Game is not active"},
      {"code": 6003, "name": "InvalidMultiplier", "msg": "Invalid multiplier (1.00x - 100.00x)"},
      {"code": 6004, "name": "InvalidGameName", "msg": "Invalid game name"},
      {"code": 6005, "name": "GameNameTooLong", "msg": "Game name too long (max 32 chars)"},
      {"code": 6006, "name": "Unauthorized", "msg": "Unauthorized"},
      {"code": 6007, "name": "MathOverflow", "msg": "Math overflow"},
      {"code": 6008, "name": "InvalidPda", "msg": "Invalid PDA"},
      {"code": 6009, "name": "BetStillActive", "msg": "Bet is still active"},
      {"code": 6010, "name": "AlreadyClaimed", "msg": "Payout already claimed"},
      {"code": 6011, "name": "NoPayout", "msg": "No payout available"},
      {"code": 6012, "name": "AlreadyHasActiveBet", "msg": "User already has an active bet"},
      {"code": 6013, "name": "BetBelowMin", "msg": "Bet below minimum"},
      {"code": 6014, "name": "BetAboveMax", "msg": "Bet above maximum"}
    ]
  };
  
  // Program ID
  const PROGRAM_ID = new PublicKey('8zEsXxhNZH2toK1Bjn3zt9jpC4JneTbYw1wMYXw7gcjS');
  
  // ============================================
  // TYPE DEFINITIONS
  // ============================================
  
  export interface ConfigAccount {
    admin: PublicKey;
    vault: PublicKey;
    minBet: BN;
    maxBet: BN;
  }
  
  export interface UserBalanceAccount {
    balance: BN;
    hasActiveBet: boolean;
  }
  
  export interface GameStateAccount {
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
  
  export interface BetAccount {
    user: PublicKey;
    amount: BN;
    active: boolean;
    gameId: PublicKey;
    payoutAmount: BN;
    claimed: boolean;
    multiplier: BN;
  }
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    signature?: string;
  }
  
  export interface GameCreationResult {
    signature: string;
    gameId: PublicKey;
    timestamp: number;
  }
  
  export interface BetPlacementResult {
    signature: string;
    betId: PublicKey;
  }
  
  export interface HeliusTransaction {
    signature: string;
    slot: number;
    timestamp: number;
    fee: number;
    feePayer: string;
    status: string;
    instructions: any[];
    events: any[];
  }
  
  export interface WebhookConfig {
    webhookURL: string;
    transactionTypes: string[];
    accountAddresses: string[];
    webhookType: string;
  }
  
  // ============================================
  // CRASH GAME API CLASS
  // ============================================
  
  export class CrashGameAPI {
    private connection: Connection;
    private provider: AnchorProvider;
    private program: Program;
    private heliusApiKey: string;
  
    constructor(wallet: Wallet, heliusApiKey: string, cluster: 'mainnet' | 'devnet' = 'mainnet') {
      this.heliusApiKey = heliusApiKey;
      const rpcUrl = `https://${cluster === 'mainnet' ? 'mainnet' : 'devnet'}.helius-rpc.com/?api-key=${heliusApiKey}`;
      this.connection = new Connection(rpcUrl, 'confirmed');
      this.provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
      });
      this.program = new Program(IDL as any, PROGRAM_ID, this.provider);
    }
  
    // ============================================
    // PDA HELPERS
    // ============================================
    
    getConfigPDA(): [PublicKey, number] {
      return PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
    }
  
    getVaultPDA(): [PublicKey, number] {
      return PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID);
    }
  
    getUserBalancePDA(userWallet: PublicKey): [PublicKey, number] {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('user_balance'), userWallet.toBuffer()],
        PROGRAM_ID
      );
    }
  
    getGamePDA(createdAt: number): [PublicKey, number] {
      const buffer = Buffer.alloc(4);
      buffer.writeUInt32LE(createdAt, 0);
      return PublicKey.findProgramAddressSync([Buffer.from('game'), buffer], PROGRAM_ID);
    }
  
    getBetPDA(userBalance: PublicKey, gameState: PublicKey): [PublicKey, number] {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('bet'), userBalance.toBuffer(), gameState.toBuffer()],
        PROGRAM_ID
      );
    }
  
    // ============================================
    // API ENDPOINTS
    // ============================================
  
    /**
     * Initialize the crash game program
     */
    async initialize(adminPubkey: PublicKey, signerKeypair: Keypair): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .initialize(adminPubkey)
          .accounts({
            config,
            signer: signerKeypair.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([signerKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Create a new user account
     */
    async createUser(userKeypair: Keypair): Promise<ApiResponse<string>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userKeypair.publicKey);
  
        const tx = await this.program.methods
          .createUser()
          .accounts({
            user: userBalance,
            userWallet: userKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Deposit funds into user balance
     */
    async deposit(userKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userKeypair.publicKey);
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .deposit(new BN(amount))
          .accounts({
            user: userBalance,
            userWallet: userKeypair.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Withdraw funds from user balance
     */
    async withdraw(userKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userKeypair.publicKey);
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .withdraw(new BN(amount))
          .accounts({
            user: userBalance,
            userWallet: userKeypair.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Create a new game
     */
    async createGame(
      signerKeypair: Keypair,
      multiplier: number,
      gameName: string,
      createdAt?: number
    ): Promise<ApiResponse<GameCreationResult>> {
      try {
        const timestamp = createdAt || Math.floor(Date.now() / 1000);
        const [gameState] = this.getGamePDA(timestamp);
  
        const tx = await this.program.methods
          .createGame(new BN(multiplier), gameName, timestamp)
          .accounts({
            gameState,
            signer: signerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([signerKeypair])
          .rpc();
  
        return {
          success: true,
          signature: tx,
          data: { signature: tx, gameId: gameState, timestamp },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Place a bet on an active game
     */
    async placeBet(
      userKeypair: Keypair,
      gameCreatedAt: number,
      amount: number
    ): Promise<ApiResponse<BetPlacementResult>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userKeypair.publicKey);
        const [gameState] = this.getGamePDA(gameCreatedAt);
        const [bet] = this.getBetPDA(userBalance, gameState);
        const [config] = this.getConfigPDA();
  
        const tx = await this.program.methods
          .placeBet(new BN(amount))
          .accounts({
            bet,
            userBalance,
            gameState,
            signer: userKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            config,
          })
          .signers([userKeypair])
          .rpc();
  
        return {
          success: true,
          signature: tx,
          data: { signature: tx, betId: bet },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Resolve a game (crash or win)
     */
    async resolveGame(
      signerKeypair: Keypair,
      gameCreatedAt: number,
      crashed: boolean,
      betAccounts: PublicKey[] = []
    ): Promise<ApiResponse<string>> {
      try {
        const [gameState] = this.getGamePDA(gameCreatedAt);
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .resolveGame(crashed)
          .accounts({
            gameState,
            vault,
            signer: signerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .remainingAccounts(
            betAccounts.map(pubkey => ({
              pubkey,
              isWritable: true,
              isSigner: false,
            }))
          )
          .signers([signerKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Claim payout from a resolved bet
     */
    async claimPayout(userKeypair: Keypair, gameCreatedAt: number): Promise<ApiResponse<string>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userKeypair.publicKey);
        const [gameState] = this.getGamePDA(gameCreatedAt);
        const [bet] = this.getBetPDA(userBalance, gameState);
  
        const tx = await this.program.methods
          .claimPayout()
          .accounts({
            bet,
            userBalance,
            signer: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Admin: Withdraw from vault
     */
    async adminWithdraw(adminKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .adminWithdraw(new BN(amount))
          .accounts({
            config,
            vault,
            signer: adminKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([adminKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Admin: Deposit bounty to vault
     */
    async adminDepositBounty(adminKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .adminDepositBounty(new BN(amount))
          .accounts({
            config,
            vault,
            signer: adminKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([adminKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Admin: Set minimum bet amount
     */
    async adminSetMinBet(adminKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
  
        const tx = await this.program.methods
          .adminSetMinBet(new BN(amount))
          .accounts({
            config,
            signer: adminKeypair.publicKey,
          })
          .signers([adminKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Admin: Set maximum bet amount
     */
    async adminSetMaxBet(adminKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
  
        const tx = await this.program.methods
          .adminSetMaxBet(new BN(amount))
          .accounts({
            config,
            signer: adminKeypair.publicKey,
          })
          .signers([adminKeypair])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // QUERY ENDPOINTS
    // ============================================
  
    /**
     * Get user balance account
     */
    async getUserBalance(userWallet: PublicKey): Promise<ApiResponse<UserBalanceAccount>> {
      try {
        const [userBalancePDA] = this.getUserBalancePDA(userWallet);
        const account = await this.program.account.userBalance.fetch(userBalancePDA);
        return { success: true, data: account as UserBalanceAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get game state
     */
    async getGameState(createdAt: number): Promise<ApiResponse<GameStateAccount>> {
      try {
        const [gameStatePDA] = this.getGamePDA(createdAt);
        const account = await this.program.account.gameState.fetch(gameStatePDA);
        return { success: true, data: account as GameStateAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get bet account
     */
    async getBet(userWallet: PublicKey, gameCreatedAt: number): Promise<ApiResponse<BetAccount>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userWallet);
        const [gameState] = this.getGamePDA(gameCreatedAt);
        const [betPDA] = this.getBetPDA(userBalance, gameState);
        const account = await this.program.account.bet.fetch(betPDA);
        return { success: true, data: account as BetAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get config account
     */
    async getConfig(): Promise<ApiResponse<ConfigAccount>> {
      try {
        const [configPDA] = this.getConfigPDA();
        const account = await this.program.account.config.fetch(configPDA);
        return { success: true, data: account as ConfigAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get vault balance
     */
    async getVaultBalance(): Promise<ApiResponse<number>> {
      try {
        const [vaultPDA] = this.getVaultPDA();
        const balance = await this.connection.getBalance(vaultPDA);
        return { success: true, data: balance };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all bets for a specific game
     */
    async getAllBetsForGame(
      gameCreatedAt: number
    ): Promise<ApiResponse<Array<{ pubkey: PublicKey; account: BetAccount }>>> {
      try {
        const [gameState] = this.getGamePDA(gameCreatedAt);
  
        const accounts = await this.program.account.bet.all([
          {
            memcmp: {
              offset: 8 + 32 + 8 + 1,
              bytes: gameState.toBase58(),
            },
          },
        ]);
  
        return { success: true, data: accounts as Array<{ pubkey: PublicKey; account: BetAccount }> };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // HELIUS ENHANCED METHODS
    // ============================================
  
    /**
     * Get enhanced transaction details from Helius
     */
    async getEnhancedTransaction(signature: string): Promise<ApiResponse<HeliusTransaction>> {
      try {
        const url = `https://api.helius.xyz/v0/transactions/?api-key=${this.heliusApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: [signature] }),
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch transaction');
        }
  
        return { success: true, data: data[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get parsed transaction history for an address
     */
    async getTransactionHistory(
      address: PublicKey,
      limit: number = 100
    ): Promise<ApiResponse<HeliusTransaction[]>> {
      try {
        const url = `https://api.helius.xyz/v0/addresses/${address.toBase58()}/transactions?api-key=${this.heliusApiKey}&limit=${limit}`;
        const response = await fetch(url);
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch transaction history');
        }
  
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Create a webhook for monitoring program events
     */
    async createWebhook(config: WebhookConfig): Promise<ApiResponse<any>> {
      try {
        const url = `https://api.helius.xyz/v0/webhooks?api-key=${this.heliusApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create webhook');
        }
  
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all webhooks
     */
    async getWebhooks(): Promise<ApiResponse<any[]>> {
      try {
        const url = `https://api.helius.xyz/v0/webhooks?api-key=${this.heliusApiKey}`;
        const response = await fetch(url);
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch webhooks');
        }
  
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId: string): Promise<ApiResponse<any>> {
      try {
        const url = `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${this.heliusApiKey}`;
        const response = await fetch(url, { method: 'DELETE' });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete webhook');
        }
  
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get asset details (for NFTs or tokens)
     */
    async getAsset(assetId: PublicKey): Promise<ApiResponse<any>> {
      try {
        const url = `https://api.helius.xyz/v0/token-metadata?api-key=${this.heliusApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mintAccounts: [assetId.toBase58()] }),
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch asset');
        }
  
        return { success: true, data: data[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get address lookup table accounts
     */
    async getAddressLookupTable(address: PublicKey): Promise<ApiResponse<any>> {
      try {
        const lookupTableAccount = await this.connection.getAddressLookupTable(address);
        return { success: true, data: lookupTableAccount.value };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // UTILITY METHODS
    // ============================================
  
    /**
     * Convert SOL to lamports
     */
    solToLamports(sol: number): number {
      return sol * LAMPORTS_PER_SOL;
    }
  
    /**
     * Convert lamports to SOL
     */
    lamportsToSol(lamports: number): number {
      return lamports / LAMPORTS_PER_SOL;
    }
  
    /**
     * Get current connection
     */
    getConnection(): Connection {
      return this.connection;
    }
  
    /**
     * Get program instance
     */
    getProgram(): Program {
      return this.program;
    }
  
    /**
     * Get program ID
     */
    getProgramId(): PublicKey {
      return PROGRAM_ID;
    }
  
    /**
     * Airdrop SOL (devnet only)
     */
    async airdrop(publicKey: PublicKey, amount: number = 1): Promise<ApiResponse<string>> {
      try {
        const signature = await this.connection.requestAirdrop(
          publicKey,
          amount * LAMPORTS_PER_SOL
        );
        await this.connection.confirmTransaction(signature);
        return { success: true, signature, data: signature };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get SOL balance for an address
     */
    async getBalance(publicKey: PublicKey): Promise<ApiResponse<number>> {
      try {
        const balance = await this.connection.getBalance(publicKey);
        return { success: true, data: balance };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Check if account exists
     */
    async accountExists(publicKey: PublicKey): Promise<boolean> {
      try {
        const info = await this.connection.getAccountInfo(publicKey);
        return info !== null;
      } catch {
        return false;
      }
    }
  
    /**
     * Get recent blockhash
     */
    async getRecentBlockhash(): Promise<ApiResponse<string>> {
      try {
        const { blockhash } = await this.connection.getLatestBlockhash();
        return { success: true, data: blockhash };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Simulate transaction
     */
    async simulateTransaction(transaction: Transaction): Promise<ApiResponse<any>> {
      try {
        const simulation = await this.connection.simulateTransaction(transaction);
        return { success: true, data: simulation };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get transaction status
     */
    async getTransactionStatus(signature: string): Promise<ApiResponse<any>> {
      try {
        const status = await this.connection.getSignatureStatus(signature);
        return { success: true, data: status };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Wait for transaction confirmation
     */
    async confirmTransaction(
      signature: string,
      commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
    ): Promise<ApiResponse<any>> {
      try {
        const latestBlockhash = await this.connection.getLatestBlockhash();
        const confirmation = await this.connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          commitment
        );
        return { success: true, data: confirmation };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // BATCH OPERATIONS
    // ============================================
  
    /**
     * Get multiple user balances at once
     */
    async getBatchUserBalances(
      userWallets: PublicKey[]
    ): Promise<ApiResponse<Map<string, UserBalanceAccount>>> {
      try {
        const results = new Map<string, UserBalanceAccount>();
        
        for (const wallet of userWallets) {
          const response = await this.getUserBalance(wallet);
          if (response.success && response.data) {
            results.set(wallet.toBase58(), response.data);
          }
        }
  
        return { success: true, data: results };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get multiple game states at once
     */
    async getBatchGameStates(
      timestamps: number[]
    ): Promise<ApiResponse<Map<number, GameStateAccount>>> {
      try {
        const results = new Map<number, GameStateAccount>();
        
        for (const timestamp of timestamps) {
          const response = await this.getGameState(timestamp);
          if (response.success && response.data) {
            results.set(timestamp, response.data);
          }
        }
  
        return { success: true, data: results };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // ANALYTICS & STATISTICS
    // ============================================
  
    /**
     * Get game statistics
     */
    async getGameStatistics(gameCreatedAt: number): Promise<ApiResponse<any>> {
      try {
        const gameResponse = await this.getGameState(gameCreatedAt);
        if (!gameResponse.success || !gameResponse.data) {
          throw new Error('Game not found');
        }
  
        const betsResponse = await this.getAllBetsForGame(gameCreatedAt);
        if (!betsResponse.success || !betsResponse.data) {
          throw new Error('Failed to fetch bets');
        }
  
        const game = gameResponse.data;
        const bets = betsResponse.data;
  
        const totalPayout = bets.reduce((sum, bet) => 
          sum + (bet.account.payoutAmount?.toNumber() || 0), 0
        );
  
        const winningBets = bets.filter(bet => 
          bet.account.payoutAmount && bet.account.payoutAmount.toNumber() > 0
        );
  
        const statistics = {
          gameId: game.gameId.toBase58(),
          gameName: game.gameName,
          multiplier: game.multiplier.toNumber() / 100,
          active: game.active,
          crashed: game.crashed,
          totalBets: game.totalBets.toNumber(),
          totalVolume: game.totalVolume.toNumber(),
          totalPayout,
          winningBets: winningBets.length,
          losingBets: bets.length - winningBets.length,
          winRate: bets.length > 0 ? (winningBets.length / bets.length) * 100 : 0,
          averageBet: bets.length > 0 ? game.totalVolume.toNumber() / bets.length : 0,
          createdAt: new Date(game.createdAt.toNumber() * 1000).toISOString(),
          resolvedAt: game.resolvedAt.toNumber() > 0 
            ? new Date(game.resolvedAt.toNumber() * 1000).toISOString() 
            : null,
        };
  
        return { success: true, data: statistics };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get user statistics
     */
    async getUserStatistics(userWallet: PublicKey): Promise<ApiResponse<any>> {
      try {
        const balanceResponse = await this.getUserBalance(userWallet);
        const betsResponse = await this.getAllUserBets(userWallet);
  
        if (!betsResponse.success || !betsResponse.data) {
          throw new Error('Failed to fetch user bets');
        }
  
        const bets = betsResponse.data;
        
        const totalWagered = bets.reduce((sum, bet) => 
          sum + bet.account.amount.toNumber(), 0
        );
  
        const totalWon = bets.reduce((sum, bet) => 
          sum + (bet.account.payoutAmount?.toNumber() || 0), 0
        );
  
        const winningBets = bets.filter(bet => 
          bet.account.payoutAmount && bet.account.payoutAmount.toNumber() > 0
        );
  
        const activeBets = bets.filter(bet => bet.account.active);
  
        const statistics = {
          userWallet: userWallet.toBase58(),
          currentBalance: balanceResponse.success && balanceResponse.data 
            ? balanceResponse.data.balance.toNumber() 
            : 0,
          hasActiveBet: balanceResponse.success && balanceResponse.data 
            ? balanceResponse.data.hasActiveBet 
            : false,
          totalBets: bets.length,
          activeBets: activeBets.length,
          totalWagered,
          totalWon,
          netProfit: totalWon - totalWagered,
          winningBets: winningBets.length,
          losingBets: bets.length - winningBets.length - activeBets.length,
          winRate: bets.length > 0 
            ? (winningBets.length / (bets.length - activeBets.length)) * 100 
            : 0,
          averageBet: bets.length > 0 ? totalWagered / bets.length : 0,
          largestWin: Math.max(...bets.map(b => b.account.payoutAmount?.toNumber() || 0)),
          largestBet: Math.max(...bets.map(b => b.account.amount.toNumber())),
        };
  
        return { success: true, data: statistics };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get platform statistics
     */
    async getPlatformStatistics(): Promise<ApiResponse<any>> {
      try {
        const configResponse = await this.getConfig();
        const vaultBalanceResponse = await this.getVaultBalance();
        const allGamesResponse = await this.getAllGames();
  
        if (!allGamesResponse.success || !allGamesResponse.data) {
          throw new Error('Failed to fetch games');
        }
  
        const games = allGamesResponse.data;
        
        const totalVolume = games.reduce((sum, game) => 
          sum + game.account.totalVolume.toNumber(), 0
        );
  
        const totalBets = games.reduce((sum, game) => 
          sum + game.account.totalBets.toNumber(), 0
        );
  
        const activeGames = games.filter(game => game.account.active);
        const resolvedGames = games.filter(game => !game.account.active);
        const crashedGames = resolvedGames.filter(game => game.account.crashed);
  
        const statistics = {
          vaultBalance: vaultBalanceResponse.success ? vaultBalanceResponse.data : 0,
          minBet: configResponse.success && configResponse.data 
            ? configResponse.data.minBet.toNumber() 
            : 0,
          maxBet: configResponse.success && configResponse.data 
            ? configResponse.data.maxBet.toNumber() 
            : 0,
          totalGames: games.length,
          activeGames: activeGames.length,
          resolvedGames: resolvedGames.length,
          crashedGames: crashedGames.length,
          crashRate: resolvedGames.length > 0 
            ? (crashedGames.length / resolvedGames.length) * 100 
            : 0,
          totalVolume,
          totalBets,
          averageBetSize: totalBets > 0 ? totalVolume / totalBets : 0,
          averageBetsPerGame: games.length > 0 ? totalBets / games.length : 0,
        };
  
        return { success: true, data: statistics };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  }
  
  // ============================================
  // EXPORT DEFAULT
  // ============================================
  
  export default CrashGameAPI; {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all active games
     */
    async getAllActiveGames(): Promise<
      ApiResponse<Array<{ pubkey: PublicKey; account: GameStateAccount }>>
    > {
      try {
        const accounts = await this.program.account.gameState.all([
          {
            memcmp: {
              offset: 8 + 8,
              bytes: Buffer.from([1]).toString('base64'),
            },
          },
        ]);
  
        return {
          success: true,
          data: accounts as Array<{ pubkey: PublicKey; account: GameStateAccount }>,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all games (active and resolved)
     */
    async getAllGames(): Promise<ApiResponse<Array<{ pubkey: PublicKey; account: GameStateAccount }>>> {
      try {
        const accounts = await this.program.account.gameState.all();
        return {
          success: true,
          data: accounts as Array<{ pubkey: PublicKey; account: GameStateAccount }>,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get user's active bet
     */
    async getUserActiveBet(
      userWallet: PublicKey
    ): Promise<ApiResponse<{ pubkey: PublicKey; account: BetAccount } | null>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userWallet);
  
        const accounts = await this.program.account.bet.all([
          {
            memcmp: {
              offset: 8,
              bytes: userBalance.toBase58(),
            },
          },
          {
            memcmp: {
              offset: 8 + 32 + 8,
              bytes: Buffer.from([1]).toString('base64'),
            },
          },
        ]);
  
        return {
          success: true,
          data: accounts.length > 0 ? (accounts[0] as { pubkey: PublicKey; account: BetAccount }) : null,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all bets for a user
     */
    async getAllUserBets(
      userWallet: PublicKey
    ): Promise<ApiResponse<Array<{ pubkey: PublicKey; account: BetAccount }>>> {
      try {
        const [userBalance] = this.getUserBalancePDA(userWallet);
  
        const accounts = await this.program.account.bet.all([
          {
            memcmp: {
              offset: 8,
              bytes: userBalance.toBase58(),
            },
          },
        ]);
  
        return { success: true, data: accounts as Array<{ pubkey: PublicKey; account: BetAccount }> };
      } catch (error: any)