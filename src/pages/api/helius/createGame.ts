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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { multiplier, gameName } = req.body;
    if (!multiplier || !gameName) {
      return res.status(400).json({ error: 'Missing multiplier or gameName' });
    }
    if (typeof gameName !== 'string' || gameName.length > 32) {
      return res.status(400).json({ error: 'gameName must be ≤ 32 chars' });
    }

    // 1. Admin
    const adminSecret = Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!));
    const adminKp = Keypair.fromSecretKey(adminSecret);

    // 2. Create timestamp
    const createdAt = Math.floor(Date.now() / 1000);

    // 3. PDA - derived from created_at (u32 little-endian bytes), not gameKp
    const createdAtBuffer = Buffer.allocUnsafe(4);
    createdAtBuffer.writeUInt32LE(createdAt, 0);
    const [gameStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('game'), createdAtBuffer],
      PROGRAM_ID
    );

    // 4. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 5. Wallet (admin only)
    const wallet: Wallet = {
      publicKey: adminKp.publicKey,
      payer: adminKp,
      signTransaction: async function <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        if (tx instanceof Transaction) {
          tx.partialSign(adminKp);
          return tx;
        }
        if (tx instanceof VersionedTransaction) {
          tx.sign([adminKp]);
          return tx;
        }
        throw new Error('Unsupported tx type');
      },
      signAllTransactions: async function <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        return txs.map((tx) => {
          if (tx instanceof Transaction) {
            tx.partialSign(adminKp);
            return tx;
          }
          if (tx instanceof VersionedTransaction) {
            tx.sign([adminKp]);
            return tx;
          }
          throw new Error('Unsupported tx type');
        });
      },
    };

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    // 6. Build transaction
    const tx = await program.methods
      .createGame(new BN(multiplier), gameName, createdAt)
      .accounts({
        gameState: gameStatePDA,
        signer: adminKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();    // ← returns Transaction

    // 7. Set blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminKp.publicKey;

    // 8. Sign with wallet (admin only)
    const signedTx = await wallet.signTransaction(tx);

    // 9. Send
    const sig = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // 10. Confirm
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    // 11. Return
    return res.status(200).json({
      success: true,
      signature: sig,
      gamePda: gameStatePDA.toBase58(),
      createdAt,
      explorer: `https://solana.fm/tx/${sig}`,
    });
  } catch (err: any) {
    console.error('createGame error →', err);
    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}