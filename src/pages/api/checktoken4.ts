// pages/api/checktokens.js
import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';
import { PublicKey } from '@solana/web3.js'; // For wallet address validation

interface HeliusResponse {
  jsonrpc: string;
  result: {
    total: number;
    limit: number;
    page: number;
    items: Array<any>;
  };
  id: number;
}

// Helper function to validate Solana address
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { wallet } = req.query;

  // Validate query parameter
  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid wallet address in URL query' });
  }

  // Validate Solana address
  if (!isValidSolanaAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1, // Numeric ID for JSON-RPC spec
    method: 'getAssetsByOwner',
    params: {
      ownerAddress: wallet,
      page: 1, // Required for pagination
      limit: 1000, // Max items per page
    },
  });

  const config = {
    method: 'post',
    url: `https://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76`,
    headers: {
      'Content-Type': 'application/json',
    },
    data,
  };

  try {
    const response = await axios.request<HeliusResponse>(config);
    res.status(200).json({ result: response.data.result });
  } catch (err) {
    const error = err as AxiosError;
    console.error('Helius API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch assets',
      details: error.response?.data || error.message,
    });
  }
}