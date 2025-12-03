// pages/api/config.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';

const PROGRAM_ID = new PublicKey("3rrWfUdkonmozHe14gg5xWgAGWx3MVr6iVy7P4LT1Qei");

// Borsh layout after the 8-byte Anchor discriminator
class Config {
  admin!: Uint8Array;
  vault!: Uint8Array;
  tax_bps!: number;

  constructor(fields: any) { Object.assign(this, fields); }
}

const schema = new Map([
  [Config, {
    kind: 'struct',
    fields: [
      ['admin', [32]],
      ['vault', [32]],
    ],
  }],
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const connection = new Connection(process.env.RPC1 ?? '');

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
    );

    const info = await connection.getAccountInfo(configPda);
    if (!info) {
      return res.status(404).json({ error: 'Config not initialized' });
    }

    // Skip Anchor's 8-byte discriminator
    const config = borsh.deserialize(schema, Config, info.data.slice(8));

    return res.status(200).json({
        success: true,
        config: {
      admin: new PublicKey(config.admin).toString(),
      vault: new PublicKey(config.vault).toString(),
      },
      configPda: configPda.toBase58(),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}