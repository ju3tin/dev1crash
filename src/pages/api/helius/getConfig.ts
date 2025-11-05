// src/pages/api/helius/getConfig.ts
import type { APIRoute } from 'astro';
import { getPDA, initProgram } from '../../../lib/solana1';

export const GET: APIRoute = async () => {
  try {
    const program = await initProgram();
    const [configPDA] = getPDA([Buffer.from('config')]);
    
    const config = await program.account.config.fetch(configPDA);

    return new Response(JSON.stringify({ 
      success: true, 
      config: {
        admin: config.admin.toString(),
        vault: config.vault.toString(),
        minBet: config.minBet.toString(),
        maxBet: config.maxBet.toString(),
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