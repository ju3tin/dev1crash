'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor1';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function GamePage() {
  const program = useProgram();
  const { publicKey: wallet, connected } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState('2.0');
  const [gameName, setGameName] = useState('Crash #1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // PDAs — only calculate when ready
  const configPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBytes()], program.programId)[0] : null;

  useEffect(() => {
    if (!program || !wallet || !connected) return;
    loadUser();
  }, [program, wallet, connected]);

  const loadUser = async () => {
    if (!program || !userPda) return;
    try {
      const data = await program.account.userBalance.fetch(userPda);
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  const initialize = async () => {
    if (!program || !wallet || !configPda) return;
    setLoading(true);
    try {
      const sig = await program.methods.initialize(wallet)
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Initialized! Tx: ${sig.slice(0, 8)}...`);
      loadUser();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!program || !wallet || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    if (lamports <= 0) {
      setStatus('Invalid amount');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods.deposit(new BN(lamports))
        .accounts({ userBalance: userPda, user: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Deposited! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      loadUser();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!program || !wallet || !configPda || !multiplier) return;
    const mult = Math.floor(parseFloat(multiplier) * 100);
    const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from('game'), Buffer.from(gameName)], program.programId);
    setLoading(true);
    try {
      const sig = await program.methods.createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Game created! Tx: ${sig.slice(0, 8)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!program || !wallet || !userPda || !configPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), wallet.toBytes()], program.programId);
    const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from('game'), Buffer.from(gameName)], program.programId);
    setLoading(true);
    try {
      const sig = await program.methods.placeBet(wallet, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userPda, gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Bet placed! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      loadUser();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-4xl font-bold text-center mb-8">CRASH GAME</h1>

        {!connected ? (
          <p className="text-center text-yellow-300">Connect wallet</p>
        ) : !user ? (
          <div className="space-y-4">
            <button onClick={initialize} disabled={loading} className="w-full p-4 bg-purple-700 rounded-lg font-bold">
              {loading ? 'Initializing...' : 'INITIALIZE GAME'}
            </button>
            <button onClick={deposit} disabled={loading} className="w-full p-4 bg-green-600 rounded-lg font-bold">
              {loading ? 'Depositing...' : 'DEPOSIT'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/10 p-6 rounded-xl text-center mb-6">
              <p>Balance: {(user.balance / 1e9).toFixed(4)} SOL</p>
            </div>

            <div className="space-y-4">
              <input placeholder="Multiplier (e.g. 2.0)" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
              <input placeholder="Game Name" value={gameName} onChange={e => setGameName(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
              <button onClick={createGame} disabled={loading} className="w-full p-4 bg-purple-600 rounded-lg font-bold">
                {loading ? 'Creating...' : 'CREATE GAME'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <input placeholder="Bet Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
              <button onClick={placeBet} disabled={loading} className="w-full p-4 bg-red-600 rounded-lg font-bold">
                {loading ? 'Betting...' : 'PLACE BET'}
              </button>
            </div>

            {status && <p className={`text-center mt-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
          </>
        )}
      </div>
    </>
  );
}