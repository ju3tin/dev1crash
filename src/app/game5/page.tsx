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
  const [userBalance, setUserBalance] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // PDAs
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId)[0] : null;
  const gamePda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('game_state'), wallet.toBytes()], program.programId)[0] : null;

  useEffect(() => {
    if (!program || !wallet || !connected) return;
    loadUserBalance();
    loadActiveGame();
  }, [program, wallet, connected]);

  const loadUserBalance = async () => {
    if (!program || !userPda) return;
    try {
      const data = await program.account.userBalance.fetch(userPda);
      setUserBalance(data);
    } catch {
      setUserBalance(null);
    }
  };

  const loadActiveGame = async () => {
    if (!program || !gamePda) return;
    try {
      const data = await program.account.gameState.fetch(gamePda);
      if (data.active) setGameState(data);
      else setGameState(null);
    } catch {
      setGameState(null);
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
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!program || !wallet || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    if (lamports < 1000) {
      setStatus('Min 0.000001 SOL');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods.deposit(new BN(lamports))
        .accounts({ userBalance: userPda, user: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Deposited! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      loadUserBalance();
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
        ) : !userBalance ? (
          <div className="space-y-4">
            <button onClick={initialize} disabled={loading} className="w-full p-4 bg-purple-700 rounded-lg font-bold">
              {loading ? 'Initializing...' : 'INITIALIZE'}
            </button>
            <input placeholder="Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
            <button onClick={deposit} disabled={loading} className="w-full p-4 bg-green-600 rounded-lg font-bold">
              {loading ? 'Depositing...' : 'DEPOSIT'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/10 p-6 rounded-xl text-center mb-6">
              <p>Balance: {(userBalance.balance / 1e9).toFixed(6)} SOL</p>
              {userBalance.hasActiveBet && <p className="text-yellow-300 mt-2">Bet Active</p>}
            </div>

            {gameState ? (
              <div className="space-y-4">
                <p className="text-center text-green-400">
                  Active: {gameState.gameName} @ {(gameState.multiplier / 100).toFixed(2)}x
                </p>
                {userBalance.hasActiveBet ? (
                  <p className="text-center text-orange-400">Waiting for admin to resolve...</p>
                ) : (
                  <p className="text-center text-gray-400">Ask admin to place your bet</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-400">No active game. Ask admin to create one.</p>
            )}

            {status && <p className={`text-center mt-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
          </>
        )}
      </div>
    </>
  );
}