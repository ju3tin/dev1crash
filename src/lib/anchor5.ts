import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idls/crash123h.json';

const PROGRAM_ID = new PublicKey('HVtr9Fs4G6qB5ACNgT4sbD7S9886M9rrJDmCHGDDvUit');

let program: Program | null = null;

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!program && wallet.publicKey) {
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
    program = new Program(idl as any, PROGRAM_ID, provider);
  }

  return program;
};