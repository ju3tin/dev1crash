import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '@/idls/crash123a.json';

const PROGRAM_ID = new PublicKey('HE2H6NQHGqMJBAy6t3a8FuTetDXLw958wee6qRaT9ouY');

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