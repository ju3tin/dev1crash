// src/lib/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import idl from '../idls/crash123k.json'; // Your IDL file

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || '8zEsXxhNZH2toK1Bjn3zt9jpC4JneTbYw1wMYXw7gcjS');

let connection: Connection;
let program: Program;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(HELIUS_RPC_URL, 'confirmed');
  }
  return connection;
}

export function getPDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export async function initProgram(): Promise<Program> {
  if (program) return program;

  const conn = getConnection();
  
  // Create a dummy wallet for read operations
  const dummyKeypair = Keypair.generate();
  const wallet = {
    publicKey: dummyKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  } as Wallet;

  const provider = new AnchorProvider(conn, wallet, {
    commitment: 'confirmed',
  });

  program = new Program(idl, PROGRAM_ID, provider)
  return program;
}

export { PROGRAM_ID };