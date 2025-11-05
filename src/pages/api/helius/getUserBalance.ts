// src/pages/api/helius/getUserBalance.ts
import type { APIRoute } from 'astro';
import { PublicKey } from '@solana/web3.js';
import { getPDA, initProgram } from '../../../lib/solana1';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userPublicKey = url.searchParams.get('userPublicKey');
    if (!userPublicKey) {
      throw new Error('userPublicKey is required');
    }

    const program = await initProgram();
    const [userPDA] = getPDA([
      Buffer.from('user'),
      new PublicKey(userPublicKey).toBuffer()
    ]);
    
    const userBalance = await program.account.userBalance.fetch(userPDA);

    return new Response(JSON.stringify({ 
      success: true, 
      balance: userBalance.balance.toString(),
      hasActiveBet: userBalance.hasActiveBet
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