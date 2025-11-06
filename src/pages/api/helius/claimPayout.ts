// pages/api/helius/claimPayout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
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
    const { userPublicKey, betPda } = req.body;
    
    if (!userPublicKey || !betPda) {
      return res.status(400).json({ error: 'Missing userPublicKey or betPda' });
    }

    // Validate public keys
    let userPubkey: PublicKey;
    let betPDA: PublicKey;
    try {
      userPubkey = new PublicKey(userPublicKey);
      betPDA = new PublicKey(betPda);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid public key format' });
    }

    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. PDA
    // User PDA - derived from user_wallet key (seeds: [b"user_balance", user_wallet.key().as_ref()])
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_balance'), userPubkey.toBuffer()],
      PROGRAM_ID
    );

    // 3. Create a dummy wallet for the provider (not used for signing)
    const dummyWallet: Wallet = {
      publicKey: userPubkey,
      payer: {} as any, // Not used
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    // 4. Build unsigned transaction
    const tx = await program.methods
      .claimPayout()
      .accounts({
        bet: betPDA,
        userBalance: userPDA,
        signer: userPubkey,
      })
      .transaction();

    // 5. Set blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;

    // 6. Serialize unsigned transaction for client to sign
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // 7. Return unsigned transaction
    return res.status(200).json({
      success: true,
      transaction: Buffer.from(serialized).toString('base64'),
      betPda: betPDA.toBase58(),
      userPda: userPDA.toBase58(),
      userWallet: userPubkey.toBase58(),
    });
  } catch (err: any) {
    console.error('claimPayout error →', err);
    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}