// pages/api/checktokens.js
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Missing wallet address in URL query' });
  }

  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'getAssetsByOwner',
    params: {
      ownerAddress: wallet,
      limit: 1000
    },
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76',
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    res.status(200).json({ result: response.data.result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assets', details: err.message });
  }
}
