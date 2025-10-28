import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from './idls/crash123a.json';

const PROGRAM_ID = new PublicKey('5ffMSBwMFAi7Du5eY2ChdtCxqPzRNznz8FermctEg');

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