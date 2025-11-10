// pages/api/helius/getAllGameStates.ts
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
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional filters from query params or body
    const { activeOnly, limit, sortBy } = req.method === 'GET' ? req.query : req.body;

    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. Create a dummy wallet for the provider (not used for reading)
    const dummyWallet: Wallet = {
      publicKey: PublicKey.default,
      payer: {} as any,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    // 3. Fetch all game states
    const allGames = await program.account.gameState.all();

    // 4. Transform and filter data
    let games = allGames.map((game: any) => ({
      multiplier: game.account.multiplier.toString(),
      active: game.account.active,
      createdAt: game.account.createdAt.toString(),
      resolvedAt: game.account.resolvedAt.toString(),
      totalBets: game.account.totalBets.toString(),
      totalVolume: game.account.totalVolume.toString(),
      gameName: game.account.gameName,
      admin: game.account.admin.toString(),
      crashed: game.account.crashed,
      gameId: game.account.gameId.toString(),
      publicKey: game.publicKey.toString(),
    }));

    // 5. Apply filters
    if (activeOnly === 'true' || activeOnly === true) {
      games = games.filter((game: any) => game.active);
    }

    // 6. Sort games
    const sortField = sortBy || 'createdAt';
    games.sort((a: any, b: any) => {
      const aVal = Number(a[sortField]) || 0;
      const bVal = Number(b[sortField]) || 0;
      return bVal - aVal; // Descending order (newest first)
    });

    // 7. Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (!isNaN(limitNum) && limitNum > 0) {
        games = games.slice(0, limitNum);
      }
    }

    // 8. Get current active game
    const activeGame = games.find((game: any) => game.active) || null;

    // 9. Return all games
    return res.status(200).json({
      success: true,
      games,
      activeGame,
      totalCount: allGames.length,
      filteredCount: games.length,
    });
  } catch (err: any) {
    console.error('getAllGameStates error →', err);
    
    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
      games: [],
    });
  }
}