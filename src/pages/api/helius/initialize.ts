// src/pages/api/helius/initialize.ts
import type { APIRoute } from 'astro';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { getPDA, initProgram } from '@/lib/solana';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { adminPublicKey } = await request.json();
    
    const program = await initProgram();
    const signer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!))
    );

    const [configPDA] = getPDA([Buffer.from('config')]);
    const [vaultPDA] = getPDA([Buffer.from('vault')]);

    const tx = await program.methods
      .initialize(new PublicKey(adminPublicKey))
      .accounts({
        config: configPDA,
        signer: signer.publicKey,
        vault: vaultPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    return new Response(JSON.stringify({ success: true, signature: tx }), {
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