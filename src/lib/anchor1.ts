import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idls/crash123b.json'; // Your new IDL

// NEW PROGRAM ID
const PROGRAM_ID = new PublicKey('HvSWvr8R3eyytUZAkWtvpFQjg3sX44PPWBACEJiz8v64');

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