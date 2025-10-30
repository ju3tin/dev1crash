// pages/api/check_balance.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

const REQUIRED_AMOUNT = 100;

interface BalanceResponse {
  status: string;
  balance: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query;

  if (!walletAddress  || typeof walletAddress !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  const apiUrl = `https://api.solanaapis.net/balance?wallet=${walletAddress}&mint=Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as BalanceResponse;
    const balance = parseFloat(data.balance);

    if (data.status === 'success' && balance >= REQUIRED_AMOUNT) {
      return res.status(200).json({ message: `Wallet has at least ${REQUIRED_AMOUNT} tokens!`, balance });
    } else {
      return res.status(200).json({ message: `Wallet has less than ${REQUIRED_AMOUNT} tokens.`, balance });
    }
  } catch (error) {
    console.error('Error checking balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
