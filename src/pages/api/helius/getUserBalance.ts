// pages/api/helius/getUserBalance.ts
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
    const { userPublicKey } = req.body;
    
    if (!userPublicKey) {
      return res.status(400).json({ error: 'Missing userPublicKey' });
    }

    // Validate public key
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userPublicKey);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid userPublicKey format' });
    }

    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. PDA - derived from user_wallet key (seeds: [b"user_balance", user_wallet.key().as_ref()])
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_balance'), userPubkey.toBuffer()],
      PROGRAM_ID
    );

    // 3. Create a dummy wallet for the provider (not used for reading)
    const dummyWallet: Wallet = {
      publicKey: PublicKey.default,
      payer: {} as any,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    // 4. Fetch user balance
    const userBalance = await program.account.userBalance.fetch(userPDA) as any;

    // 5. Return user balance
    return res.status(200).json({
      success: true,
      balance: userBalance.balance.toString(),
      hasActiveBet: userBalance.hasActiveBet,
      userPda: userPDA.toBase58(),
      userWallet: userPubkey.toBase58(),
    });
  } catch (err: any) {
    console.error('getUserBalance error →', err);
    
    // Handle account not found error
    if (err.message?.includes('Account does not exist') || err.message?.includes('Invalid account')) {
      return res.status(404).json({
        success: false,
        error: 'User balance not found. User may need to be created first.',
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}