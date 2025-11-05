// src/pages/api/helius/resolveGame.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@project-serum/anchor';
// Import the appropriate IDL for your program
import idl from '@/idls/crash123k.json';

const PROGRAM_ID = new PublicKey('8zEsXxhNZH2toK1Bjn3zt9jpC4JneTbYw1wMYXw7gcjS');
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Example: Admin key loaded from env
  const ADMIN_SECRET = process.env.ADMIN_SECRET; // Base58 string!
  if (!ADMIN_SECRET) return res.status(500).json({ error: 'Admin key not set on server.' });

  try {
    const adminKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(ADMIN_SECRET))
    );
    const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
    const provider = new AnchorProvider(connection, { publicKey: adminKeypair.publicKey, signTransaction: async (tx: any) => { tx.partialSign(adminKeypair); return tx; }, signAllTransactions: undefined } as any, {});
    const program = new Program(idl as any, PROGRAM_ID, provider);

    // Example: resolve a game via ID...
    const { gameId, crashNow, vaultPda } = req.body;

    const tx = await program.methods.resolveGame(crashNow)
      .accounts({
        gameState: new PublicKey(gameId),
        vault: new PublicKey(vaultPda),
        signer: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      // .remainingAccounts(...) if needed
      .transaction();

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = adminKeypair.publicKey;
    tx.partialSign(adminKeypair);

    const signedTxBase64 = tx.serialize().toString('base64');

    // Forward to Helius for sending
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "sendTransaction",
        params: [signedTxBase64],
      }),
    });
    const result = await response.json();
    if (result.error) return res.status(500).json({ error: result.error.message });
    return res.status(200).json({ signature: result.result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || e.toString() });
  }
}