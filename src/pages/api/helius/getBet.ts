import type { APIRoute } from 'astro';
import { PublicKey } from '@solana/web3.js';
import { initProgram } from '../../../lib/solana1';

export const GET: APIRoute = async ({ url }) => {
  try {
    const betId = url.searchParams.get('betId');
    if (!betId) {
      throw new Error('betId is required');
    }

    const program = await initProgram();
    const bet = await program.account.bet.fetch(new PublicKey(betId));

    return new Response(JSON.stringify({ 
      success: true, 
      bet: {
        user: bet.user.toString(),
        amount: bet.amount.toString(),
        active: bet.active,
        gameId: bet.gameId.toString(),
        payoutAmount: bet.payoutAmount.toString(),
        claimed: bet.claimed,
        multiplier: bet.multiplier.toString(),
      }
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