// pages/api/vault-balance.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey("3rrWfUdkonmozHe14gg5xWgAGWx3MVr6iVy7P4LT1Qei");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const connection = new Connection('https://api.devnet.solana.com');

    // Derive config PDA to get the vault address from on-chain data
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(configPda);
    if (!accountInfo) {
      return res.status(404).json({ error: 'Config not initialized yet' });
    }

    // Skip first 8 bytes (Anchor discriminator), then read vault pubkey at offset 32+32 = 64
    const data = accountInfo.data.slice(8);
    const vaultPubkey = new PublicKey(data.slice(32, 64)); // vault is the second Pubkey

    // Now get the actual SOL balance
    const balanceLamports = await connection.getBalance(vaultPubkey);
    const balanceSOL = balanceLamports / 1_000_000_000;

    return res.status(200).json({
      vault: vaultPubkey.toBase58(),
      balanceSOL: balanceSOL.toFixed(9),
      balanceLamports,
      explorer: `https://explorer.solana.com/address/${vaultPubkey.toBase58()}?cluster=devnet`,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}