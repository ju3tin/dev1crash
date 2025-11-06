// pages/api/helius/adminDepositBounty.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl, BN } from '@coral-xyz/anchor';
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
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // 1. Admin
    const adminSecret = Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!));
    const adminKp = Keypair.fromSecretKey(adminSecret);

    // 2. PDAs
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
    );

    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      PROGRAM_ID
    );

    // 3. Connection
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

    // 4. Wallet (admin only)
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

    // 5. Build transaction
    const tx = await program.methods
      .adminDepositBounty(new BN(amountNum))
      .accounts({
        config: configPDA,
        vault: vaultPDA,
        signer: adminKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    // 6. Set blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminKp.publicKey;

    // 7. Sign with wallet (admin only)
    const signedTx = await wallet.signTransaction(tx);

    // 8. Send
    const sig = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // 9. Confirm
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    // 10. Return
    return res.status(200).json({
      success: true,
      signature: sig,
      amount: amountNum,
      vaultPda: vaultPDA.toBase58(),
      explorer: `https://solana.fm/tx/${sig}`,
    });
  } catch (err: any) {
    console.error('adminDepositBounty error →', err);
    return res.status(500).json({
      success: false,
      error: err.message ?? 'Unknown error',
    });
  }
}
