// src/pages/api/helius/getGameState.ts
import type { APIRoute } from 'astro';
import { PublicKey } from '@solana/web3.js';
import { initProgram } from '../../../lib/solana1';

export const GET: APIRoute = async ({ url }) => {
  try {
    const gameId = url.searchParams.get('gameId');
    if (!gameId) {
      throw new Error('gameId is required');
    }

    const program = await initProgram();
    const gameState = await program.account.gameState.fetch(new PublicKey(gameId));

    return new Response(JSON.stringify({ 
      success: true, 
      game: {
        multiplier: gameState.multiplier.toString(),
        active: gameState.active,
        createdAt: gameState.createdAt.toString(),
        resolvedAt: gameState.resolvedAt.toString(),
        totalBets: gameState.totalBets.toString(),
        totalVolume: gameState.totalVolume.toString(),
        gameName: gameState.gameName,
        admin: gameState.admin.toString(),
        crashed: gameState.crashed,
        gameId: gameState.gameId.toString(),
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
