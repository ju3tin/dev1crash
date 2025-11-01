import { AnchorProvider, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idls/idl2.json';

const PROGRAM_ID = new PublicKey('J9ck4tit2TCadgAMXPHEJHoLNdQ3fYDFchBdseXGzSSb');

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