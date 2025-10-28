'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const program = useProgram();
  const { publicKey: wallet } = useWallet(); // Correct way
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState('');
  const [status, setStatus] = useState('');
  const [lastRound, setLastRound] = useState<any>(null);

  useEffect(() => {
    if (!program || !wallet) return;
    checkAdmin();
  }, [program, wallet]);

  const checkAdmin = async () => {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
    try {
      const config = await program.account.gameConfig.fetch(configPda);
      setIsAdmin(config.admin.toBase58() === wallet.toBase58());
      loadLastRound();
    } catch (e) {
      console.log('Config not initialized');
    }
  };

  const executeRound = async () => {
    if (!program || !isAdmin || !wallet) return;
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], program.programId);
    const [roundPda] = PublicKey.findProgramAddressSync([Buffer.from('round')], program.programId);
    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBytes()], program.programId);

    try {
      await program.methods.adminExecuteRound()
        .accounts({
          config: configPda,
          user: userPda,
          vault: vaultPda,
          round: roundPda,
          admin: wallet,
          userWallet: wallet,
          clock: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus('Round executed!');
      loadLastRound();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  const changeAdmin = async () => {
    if (!program || !isAdmin || !newAdmin || !wallet) return;
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
    try {
      await program.methods.adminChangeWallet(new PublicKey(newAdmin))
        .accounts({ config: configPda, admin: wallet })
        .rpc();
      setStatus('Admin changed!');
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  const loadLastRound = async () => {
    if (!program) return;
    const [roundPda] = PublicKey.findProgramAddressSync([Buffer.from('round')], program.programId);
    try {
      const data = await program.account.round.fetch(roundPda);
      setLastRound(data);
    } catch (e) {
      console.log('No round yet');
    }
  };

  if (!wallet) return (
    <>
      <Navbar />
      <div className="pt-24 text-center">Connect wallet</div>
    </>
  );

  if (!isAdmin) return (
    <>
      <Navbar />
      <div className="pt-24 text-center text-red-400">Unauthorized: Admin only</div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24 bg-red-900/50 rounded-xl border border-red-500">
        <h2 className="text-3xl font-bold mb-6 text-red-300">ADMIN PANEL</h2>
        <button onClick={executeRound} className="w-full p-4 bg-red-600 rounded font-bold text-xl mb-4">
          EXECUTE ROUND
        </button>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="New Admin Pubkey"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            className="w-full p-3 bg-white/10 rounded"
          />
          <button onClick={changeAdmin} className="w-full p-3 bg-orange-600 rounded">
            Change Admin
          </button>
        </div>
        {lastRound && (
          <p className="mt-6 text-green-400 text-center">
            Last Crash: <strong>{lastRound.crashPoint.toFixed(2)}x</strong> (Round #{lastRound.id.toString()})
          </p>
        )}
        {status && <p className="mt-4 text-yellow-300 text-center">{status}</p>}
      </div>
    </>
  );
}