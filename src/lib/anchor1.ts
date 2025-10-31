import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idls/crash123c.json'; // Your IDL

// NEW PROGRAM ID
const PROGRAM_ID = new PublicKey('92g52WQD8pRb25GRvEpoMgrfCHSiZY2FCNZFb3369KnD');

let program: Program | null = null;

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!program && wallet.publicKey) {
    const provider = new AnchorProvider(connection, wallet as any, {});
    program = new Program(idl as any, PROGRAM_ID, provider);
  }

  return program;
};