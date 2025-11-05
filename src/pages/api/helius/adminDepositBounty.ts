// src/pages/api/helius/adminDepositBounty.ts
//import type { APIRoute } from 'astro';
import { Keypair } from '@solana/web3.js';
import { BN, web3 } from '@coral-xyz/anchor';
import { getPDA, initProgram } from '../../../lib/solana';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount } = await request.json();
    
    const program = await initProgram();
    const admin = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!))
    );

    const [configPDA] = getPDA([Buffer.from('config')]);
    const [vaultPDA] = getPDA([Buffer.from('vault')]);

    const tx = await program.methods
      .adminDepositBounty(new BN(amount))
      .accounts({
        config: configPDA,
        vault: vaultPDA,
        signer: admin.publicKey,
        systemProgram: web3.SystemProgram.programId,
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
