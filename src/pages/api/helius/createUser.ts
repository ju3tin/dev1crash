// src/pages/api/helius/createUser.ts
import type { APIRoute } from 'astro';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getPDA, initProgram, getConnection } from '../../../lib/solana1';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userPublicKey } = await request.json();
    
    const program = await initProgram();
    const connection = getConnection();
    
    const [userPDA] = getPDA([
      Buffer.from('user'),
      new PublicKey(userPublicKey).toBuffer()
    ]);

    const ix = await program.methods
      .createUser()
      .accounts({
        user: userPDA,
        userWallet: new PublicKey(userPublicKey),
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: new PublicKey(userPublicKey)
    }).add(ix);

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return new Response(JSON.stringify({ 
      success: true, 
      transaction: Buffer.from(serialized).toString('base64')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};