// pages/api/helius/getConfig.ts
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
    // 1. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 2. PDA - Config PDA is derived from [b"config"]
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
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

    // 4. Fetch config
    const config = await program.account.config.fetch(configPDA) as any;

    // 5. Return config
    return res.status(200).json({
      success: true,
      config: {
        admin: config.admin.toString(),
        vault: config.vault.toString(),
      },
      configPda: configPDA.toBase58(),
    });
  } catch (err: any) {
    console.error('getConfig error →', err);
    
    // Handle account not found error
    if (err.message?.includes('Account does not exist') || err.message?.includes('Invalid account')) {
      return res.status(404).json({
        success: false,
        error: 'Config not found. Program may need to be initialized first.',
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}