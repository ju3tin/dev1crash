// pages/api/helius/getGameState.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import idl from '@/idls/crash123k.json';

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gamePda, createdAt } = req.body;
    
    // Validate input - need either gamePda or createdAt
    if (!gamePda && createdAt === undefined) {
      return res.status(400).json({ error: 'Missing gamePda or createdAt' });
    }

    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. Get game PDA
    let gameStatePDA: PublicKey;
    if (gamePda) {
      // Use provided PDA directly
      try {
        gameStatePDA = new PublicKey(gamePda);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid gamePda format' });
      }
    } else {
      // Derive PDA from createdAt
      const createdAtNum = Number(createdAt);
      if (isNaN(createdAtNum) || createdAtNum < 0) {
        return res.status(400).json({ error: 'Invalid createdAt value' });
      }
      const createdAtBuffer = Buffer.allocUnsafe(4);
      createdAtBuffer.writeUInt32LE(createdAtNum, 0);
      [gameStatePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('game'), createdAtBuffer],
        PROGRAM_ID
      );
    }

    // 3. Create a dummy wallet for the provider (not used for reading)
    const dummyWallet: Wallet = {
      publicKey: PublicKey.default,
      payer: {} as any,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    // 4. Fetch game state
    const gameState = await program.account.gameState.fetch(gameStatePDA) as any;

    // 5. Return game state
    return res.status(200).json({
      success: true,
      game: {
        multiplier: gameState.multiplier.toString(),
        active: gameState.active,
        createdAt: gameState.createdAt.toString(),
        resolvedAt: gameState.resolvedAt.toString(),
        totalBets: gameState.totalBets.toString(),
        totalVolume: gameState.totalVolume.toString(),
        gameName: gameState.gameName,
        admin: gameState.admin.toString(),
        crashed: gameState.crashed,
        gameId: gameState.gameId.toString(),
      },
      gamePda: gameStatePDA.toBase58(),
    });
  } catch (err: any) {
    console.error('getGameState error →', err);
    
    // Handle account not found error
    if (err.message?.includes('Account does not exist') || err.message?.includes('Invalid account')) {
      return res.status(404).json({
        success: false,
        error: 'Game state not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}
