import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import idl from '@/idls/crash123k.json';

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

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

    const adminAddress = "14RxG3uBSHkzpiEE3muBMxg2dEQXw2rSvzJvJatWuQ2r";
    const wallet = req.query.wallet as string | undefined;
    
    // Check if wallet matches admin
    const isAdmin = wallet && wallet === adminAddress;

    // Return the fixed JSON response with isAdmin field
    return res.status(200).json({
      success: true,
      config: {
        admin: config.admin.toString(),
        vault: "9yRoPLZD4f3RkUrHqQvTspeYR2hXukGVCJZFhTwBox83",
      },
      configPda: "g34CWF432qdBWKPczuko7nokJAcCTiT3hcG3zX49yaY",
      isAdmin: isAdmin || false,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
