// pages/api/helius/initialize.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Wallet,
  Idl,
} from '@coral-xyz/anchor';
import { getPDA } from '@/lib/solana1';
import idl from '@/idls/crash123k.json';

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'C3aRucgPgxHHD5nrT4busuTTnVmF55gqJwAccQwr8Qi4');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminPublicKey } = req.body;
    if (!adminPublicKey) {
      return res.status(400).json({ error: 'Missing adminPublicKey' });
    }

    const adminPubkey = new PublicKey(adminPublicKey);

    // Load signer
    const secretKey = Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!));
    const signer = Keypair.fromSecretKey(secretKey);

    // PDAs
    const [configPDA] = getPDA([Buffer.from('config')]);
    const [vaultPDA] = getPDA([Buffer.from('vault')]);

    // Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // Wallet with payer + correct signing
    const wallet: Wallet = {
      publicKey: signer.publicKey,
      payer: signer,
      signTransaction: async (tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(signer);
        } else if (tx instanceof VersionedTransaction) {
          tx.sign([signer]);
        }
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {
          if (tx instanceof Transaction) {
            tx.partialSign(signer);
          } else if (tx instanceof VersionedTransaction) {
            tx.sign([signer]);
          }
          return tx;
        });
      },
    };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });

    // CORRECT ORDER: idl, PROGRAM_ID, provider
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    const signature = await program.methods
      .initialize(adminPubkey)
      .accounts({
        config: configPDA,
        signer: signer.publicKey,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    // Confirm
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    });

    const tx = await connection.getTransaction(signature, { commitment: 'confirmed' });
    const blockTime = tx?.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null;

    return res.status(200).json({
      success: true,
      signature,
      blockTime,
      explorer: `https://solana.fm/tx/${signature}`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}