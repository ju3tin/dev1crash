// src/pages/api/helius/adminSetMinBet.ts
import type { APIRoute } from 'astro';
import { Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getPDA, initProgram } from '../../../lib/solana1';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount } = await request.json();
    
    const program = await initProgram();
    const admin = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!))
    );

    const [configPDA] = getPDA([Buffer.from('config')]);

    const tx = await program.methods
      .adminSetMinBet(new BN(amount))
      .accounts({
        config: configPDA,
        signer: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    return new Response(JSON.stringify({ 
      success: true, 
      signature: tx
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