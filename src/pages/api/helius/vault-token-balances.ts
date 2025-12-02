// pages/api/vault-token-balances.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey("3rrWfUdkonmozHe14gg5xWgAGWx3MVr6iVy7P4LT1Qei");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const connection = new Connection('https://api.devnet.solana.com');

    // Get vault address from config
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
    const configInfo = await connection.getAccountInfo(configPda);
    if (!configInfo) return res.status(404).json({ error: 'Config not initialized' });

    const vaultPubkey = new PublicKey(configInfo.data.slice(8 + 32, 8 + 64)); // vault is 2nd Pubkey

    // Fetch ALL token accounts owned by the vault
    const tokenAccounts = await connection.getTokenAccountsByOwner(vaultPubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKLMAf9o1QebM9o7z5n1W8"), // SPL Token program
    });

    const balances = tokenAccounts.value.map((acc) => {
      const data = acc.account.data;
      const amount = data.readBigUInt64LE(64); // amount is at offset 64
      const mint = new PublicKey(data.slice(0, 32));

      return {
        mint: mint.toBase58(),
        amount: amount.toString(),
        amountFormatted: Number(amount) / 1_000_000, // assuming 6 decimals (USDC, etc.)
        tokenAccount: acc.pubkey.toBase58(),
      };
    });

    return res.status(200).json({
      vault: vaultPubkey.toBase58(),
      solBalance: (await connection.getBalance(vaultPubkey)) / 1e9,
      tokenBalances: balances,
      totalTokenAccounts: balances.length,
      explorer: `https://explorer.solana.com/address/${vaultPubkey.toBase58()}?cluster=devnet`,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}