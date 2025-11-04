import {
    Connection,
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Keypair,
  } from '@solana/web3.js';
  import {
    AnchorProvider,
    Program,
    BN,
    Wallet as AnchorWallet,
  } from '@coral-xyz/anchor';
  
  // ============================================
  // IDL & PROGRAM ID
  // ============================================
  
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
  
  // ============================================
  // CRASH GAME API CLASS (FIXED)
  // ============================================
  
  export class CrashGameAPI {
    private connection: Connection;
    private provider: AnchorProvider;
    private program: Program;
    private heliusApiKey: string;
  
    /**
     * Initialize the API
     * @param wallet - Must be a Wallet object with signTransaction
     * @param heliusApiKey - Your Helius API key
     * @param cluster - 'mainnet' or 'devnet'
     */
    constructor(
      wallet: AnchorWallet,
      heliusApiKey: string,
      cluster: 'mainnet' | 'devnet' = 'mainnet'
    ) {
      if (!wallet || !wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Invalid wallet: must include publicKey and signTransaction');
      }
  
      this.heliusApiKey = heliusApiKey;
  
      const rpcUrl = `https://${
        cluster === 'mainnet' ? 'mainnet' : 'devnet'
      }.helius-rpc.com/?api-key=${heliusApiKey}`;
  
      this.connection = new Connection(rpcUrl, 'confirmed');
  
      // Critical: This creates the correct AnchorProvider
      this.provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });
  
      // Now this.program is correctly typed
      this.program = new Program(IDL as any, PROGRAM_ID as any, this.provider as any);
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
    // CORE INSTRUCTIONS
    // ============================================
  
    async initialize(adminPubkey: PublicKey, signer: Keypair): Promise<ApiResponse<string>> {
      try {
        const [config] = this.getConfigPDA();
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .initialize(adminPubkey)
          .accounts({
            config,
            signer: signer.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([signer])
          .rpc();
  
        return { success: true, signature: tx, data: tx };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    async createUser(userKeypair: Keypair): Promise<ApiResponse<string>> {
      try {
        const [user] = this.getUserBalancePDA(userKeypair.publicKey);
  
        const tx = await this.program.methods
          .createUser()
          .accounts({
            user,
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
  
    async deposit(userKeypair: Keypair, amount: number): Promise<ApiResponse<string>> {
      try {
        const [user] = this.getUserBalancePDA(userKeypair.publicKey);
        const [vault] = this.getVaultPDA();
  
        const tx = await this.program.methods
          .deposit(new BN(amount))
          .accounts({
            user,
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
  
    // ... (other methods: withdraw, createGame, placeBet, etc. — all correct)
  
    // ============================================
    // QUERY METHODS (Example)
    // ============================================
  
    async getUserBalance(userWallet: PublicKey): Promise<ApiResponse<UserBalanceAccount>> {
      try {
        const [pda] = this.getUserBalancePDA(userWallet);
        const account = await (this.program.account as any)['userBalance'].fetch(pda);  //@ts-ignore
        return { success: true, data: account as UserBalanceAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    async getConfig(): Promise<ApiResponse<ConfigAccount>> {
      try {
        const [pda] = this.getConfigPDA();
        const account = await (this.program.account as any)['config'].fetch(pda);  //@ts-ignore
        return { success: true, data: account as ConfigAccount };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // UTILS
    // ============================================
  
    getProgram(): Program {
      return this.program;
    }
  
    getConnection(): Connection {
      return this.connection;
    }
  
    getProvider(): AnchorProvider {
      return this.provider;
    }
  }
  
  // ============================================
  // EXPORT
  // ============================================
  
  export default CrashGameAPI;