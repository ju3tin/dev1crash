// src/pages/api/helius/createGame.ts
import type { APIRoute } from 'astro';
import { Keypair } from '@solana/web3.js';
import { BN, web3 } from '@coral-xyz/anchor';
import { getPDA, initProgram } from '../../../lib/solana1';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { multiplier, gameName, createdAt } = await request.json();
    
    const program = await initProgram();
    const signer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.ADMIN_PRIVATE_KEY!))
    );

    const gameId = Keypair.generate();
    const [gameStatePDA] = getPDA([
      Buffer.from('game'),
      gameId.publicKey.toBuffer()
    ]);

    const tx = await program.methods
      .createGame(new BN(multiplier), gameName, createdAt)
      .accounts({
        gameState: gameStatePDA,
        signer: signer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    return new Response(JSON.stringify({ 
      success: true, 
      signature: tx,
      gameId: gameStatePDA.toString()
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
