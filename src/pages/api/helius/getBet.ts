// pages/api/helius/getBet.ts
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
    const { betPda, userPda, gameStatePda } = req.body;
    
    // Validate input - need either betPda or (userPda and gameStatePda)
    if (!betPda && (!userPda || !gameStatePda)) {
      return res.status(400).json({ error: 'Missing betPda or (userPda and gameStatePda)' });
    }

    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. Get bet PDA
    let betPDA: PublicKey;
    if (betPda) {
      // Use provided PDA directly
      try {
        betPDA = new PublicKey(betPda);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid betPda format' });
      }
    } else {
      // Derive PDA from userPda and gameStatePda
      let userPDA: PublicKey;
      let gameStatePDA: PublicKey;
      try {
        userPDA = new PublicKey(userPda);
        gameStatePDA = new PublicKey(gameStatePda);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid userPda or gameStatePda format' });
      }
      // Bet PDA - derived from [b"bet", user_balance.key().as_ref(), game_state.key().as_ref()]
      [betPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('bet'), userPDA.toBuffer(), gameStatePDA.toBuffer()],
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

    // 4. Fetch bet
    const bet = await program.account.bet.fetch(betPDA) as any;

    // 5. Return bet
    return res.status(200).json({
      success: true,
      bet: {
        user: bet.user.toString(),
        amount: bet.amount.toString(),
        active: bet.active,
        gameId: bet.gameId.toString(),
        payoutAmount: bet.payoutAmount.toString(),
        claimed: bet.claimed,
      },
      betPda: betPDA.toBase58(),
    });
  } catch (err: any) {
    console.error('getBet error →', err);
    
    // Handle account not found error
    if (err.message?.includes('Account does not exist') || err.message?.includes('Invalid account')) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}