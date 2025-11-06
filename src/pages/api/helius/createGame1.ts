// pages/api/helius/createGame.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import idl from '@/idls/crash123k.json';

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { multiplier, gameName, createdAt, gameSecret } = req.body;
    if (!multiplier || !gameName || createdAt === undefined || !gameSecret) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const adminSecret = Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!));
    const adminKp = Keypair.fromSecretKey(adminSecret);
    const gameKp = Keypair.fromSecretKey(Uint8Array.from(gameSecret));

    const [gameStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('game'), gameKp.publicKey.toBuffer()],
      PROGRAM_ID
    );

    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // === TYPE‑SAFE WALLET ===
    const wallet: Wallet = {
      publicKey: adminKp.publicKey,
      payer: adminKp,

      // Generic signTransaction
      signTransaction: async function <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> {
        if (tx instanceof Transaction) {
          tx.partialSign(adminKp, gameKp);
          return tx;
        }
        if (tx instanceof VersionedTransaction) {
          tx.sign([adminKp, gameKp]);
          return tx;
        }
        throw new Error('Unsupported transaction type');
      },

      // Generic signAllTransactions
      signAllTransactions: async function <T extends Transaction | VersionedTransaction>(
        txs: T[]
      ): Promise<T[]> {
        return txs.map((tx) => {
          if (tx instanceof Transaction) {
            tx.partialSign(adminKp, gameKp);
            return tx;
          }
          if (tx instanceof VersionedTransaction) {
            tx.sign([adminKp, gameKp]);
            return tx;
          }
          throw new Error('Unsupported transaction type');
        });
      },
    };

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    const sig = await program.methods
      .createGame(new BN(multiplier), gameName, createdAt)
      .accounts({
        gameState: gameStatePDA,
        signer: adminKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([gameKp])
      .rpc();

    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed');

    return res.status(200).json({
      success: true,
      signature: sig,
      gamePda: gameStatePDA.toBase58(),
      gamePubkey: gameKp.publicKey.toBase58(),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}