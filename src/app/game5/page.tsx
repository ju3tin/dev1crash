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
  const [multiplier, setMultiplier] = useState('2.0');
  const [gameName, setGameName] = useState('Crash #1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // PDAs — only when program and wallet exist
  const configPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
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
      setStatus('Minimum 0.000001 SOL');
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

  const createGame = async () => {
    if (!program || !wallet || !gamePda || !configPda || !multiplier) return;
    const mult = Math.floor(parseFloat(multiplier) * 100);
    if (mult < 100 || mult > 10000) {
      setStatus('Multiplier 1.0x - 100x');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods.createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Game created! Tx: ${sig.slice(0, 8)}...`);
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!program || !wallet || !userPda || !gamePda || !configPda || !gameState || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    if (lamports < 1000) {
      setStatus('Minimum bet 0.000001 SOL');
      return;
    }
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), wallet.toBytes(), gamePda.toBytes()],
      program.programId
    );
    setLoading(true);
    try {
      const sig = await program.methods.placeBet(wallet, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userPda, gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Bet placed! Tx: ${sig.slice(0, 8)}...`);
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
              {userBalance.hasActiveBet && <p className="text-yellow-300 mt-2">Active Bet: {(userBalance.activeBetAmount / 1e9).toFixed(6)} SOL</p>}
            </div>

            {!gameState ? (
              <div className="space-y-4">
                <input placeholder="Multiplier (e.g. 2.0)" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <input placeholder="Game Name (max 32)" value={gameName} onChange={e => setGameName(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <button onClick={createGame} disabled={loading} className="w-full p-4 bg-purple-600 rounded-lg font-bold">
                  {loading ? 'Creating...' : 'CREATE GAME'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-green-400">Active: {gameState.gameName} @ {(gameState.multiplier / 100).toFixed(2)}x</p>
                <input placeholder="Bet Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <button onClick={placeBet} disabled={loading || userBalance.hasActiveBet} className="w-full p-4 bg-red-600 rounded-lg font-bold">
                  {loading ? 'Betting...' : userBalance.hasActiveBet ? 'BET ACTIVE' : 'PLACE BET'}
                </button>
              </div>
            )}

            {status && <p className={`text-center mt-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
          </>
        )}
      </div>
    </>
  );
}