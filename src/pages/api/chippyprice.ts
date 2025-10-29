// pages/api/convert.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

interface CoinPrices {
  solana: number; // SOL price in USD
  chippy: number; // CHIPPY price in USD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch the SOL and CHIPPY prices from CoinGecko API
    const response = await axios.get(COINGECKO_API_URL, {
      params: {
        ids: 'solana,chippy',
        vs_currencies: 'usd',
      },
    });

    // Get the prices
    const solanaPrice = response.data.solana.usd;
    const chippyPrice = response.data.chippy?.usd;

    // If CHIPPY price is not available
    if (!chippyPrice) {
      return res.status(400).json({ error: 'CHIPPY token data not found' });
    }

    // Calculate the conversion rate (1 SOL to CHIPPY)
    const solToChippy = solanaPrice / chippyPrice;

    // Return the conversion rate in response
    return res.status(200).json({
      solanaPrice,
      chippyPrice,
      solToChippy,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
