// @/lib/helius.ts
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY`; // Replace with your key

// Custom Connection using Helius RPC
export const heliusConnection = new Connection(HELIUS_RPC_URL, 'confirmed');

// Helper: Direct RPC call to Helius (for enhanced methods like getProgramAccountsV2)
export async function heliusRpcCall(method: string, params: any[]) {
  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// Example: Fetch all program accounts with pagination (Helius-optimized)
export async function fetchProgramAccountsPaginated(programId: PublicKey, filters: any = {}, limit = 1000) {
  let allAccounts: any[] = [];
  let paginationKey: string | null = null;

  do {
    const response = await heliusRpcCall('getProgramAccountsV2', [
      programId.toString(),
      {
        encoding: 'base64',
        filters,
        limit,
        ...(paginationKey && { paginationKey }),
      },
    ]);
    allAccounts.push(...response.accounts);
    paginationKey = response.paginationKey;
  } while (paginationKey);

  return allAccounts;
}

// Example: Get account info with Helius
export async function getAccountInfo(pubkey: PublicKey) {
  return await heliusRpcCall('getAccountInfo', [pubkey.toString(), { encoding: 'base64' }]);
}

// Update your Anchor provider to use Helius RPC (in @/lib/anchor6.ts)
import { AnchorProvider } from '@coral-xyz/anchor';
export const heliusProvider = new AnchorProvider(heliusConnection, wallet, {});
export function useProgram() {
  return new Program(idl, PROGRAM_ID, heliusProvider); // idl from your IDL.json
}