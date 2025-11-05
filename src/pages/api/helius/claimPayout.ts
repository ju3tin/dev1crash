// src/pages/api/helius/claimPayout.ts
import type { APIRoute } from 'astro';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getPDA, initProgram, getConnection } from '../../../lib/solana1';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userPublicKey, betId } = await request.json();
    
    const program = await initProgram();
    const connection = getConnection();
    
    const userPubkey = new PublicKey(userPublicKey);
    const betPDA = new PublicKey(betId);
    
    const [userBalancePDA] = getPDA([
      Buffer.from('user'),
      userPubkey.toBuffer()
    ]);

    const ix = await program.methods
      .claimPayout()
      .accounts({
        bet: betPDA,
        userBalance: userBalancePDA,
        signer: userPubkey,
      })
      .instruction();

    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: userPubkey
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