// pages/api/check_balance.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const REQUIRED_AMOUNT = 100;

interface BalanceResponse {
  message: string;
  balance: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<BalanceResponse | { error: string }>) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid wallet address' });
  }

  // MOCK BALANCE: randomly generate a balance for demonstration
  const balance = Math.floor(Math.random() * 200); // 0 - 199 tokens

  if (balance >= REQUIRED_AMOUNT) {
    return res.status(200).json({
      message: `Wallet ${address} has at least ${REQUIRED_AMOUNT} tokens!`,
      balance,
    });
  } else {
    return res.status(200).json({
      message: `Wallet ${address} has less than ${REQUIRED_AMOUNT} tokens.`,
      balance,
    });
  }
}
