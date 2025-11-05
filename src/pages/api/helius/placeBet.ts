import type { NextApiRequest, NextApiResponse } from 'next';

// Optional: Pull API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'YOUR_HELIUS_API_KEY_HERE'; // <-- set in .env.local for security
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet, gameId, amount } = req.body;

  if (!wallet || !gameId || !amount) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Build your proper transaction/instruction here. This is a placeholder.
  // You normally need to construct a serialized transaction/instruction for your Anchor program.

  // EXAMPLE: Helius raw transaction (pseudocode, you must adapt for your program)
  const heliusPayload = {
    jsonrpc: "2.0",
    id: "1",
    method: "sendTransaction",
    params: [
      /* Your transaction base64 here - see Solana guide for serializing Anchor program TXs */
    ]
  };

  try {
    const heliusRes = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(heliusPayload)
    });

    const heliusData = await heliusRes.json();

    if (heliusData.error) {
      return res.status(500).json({ error: heliusData.error.message || 'Helius RPC error' });
    }
    // Success: TX signature or result
    return res.status(200).json(heliusData.result);

  } catch (e) {
    return res.status(500).json({ error: (e as Error).message || 'Server error' });
  }
}