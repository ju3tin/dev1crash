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
  const [balance, setBalance] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('');
  const [multiplier, setMultiplier] = useState('');
  const [gameName, setGameName] = useState('Crash #1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program?.programId!);
  const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet?.toBytes()!], program?.programId!);

  useEffect(() => {
    if (!program || !wallet) return;
    loadBalance();
    loadActiveGame();
  }, [program, wallet]);

  const loadBalance = async () => {
    if (!program || !wallet) return;
    try {
      const data = await program.account.userBalance.fetch(userPda);
      setBalance(data);
    } catch {
      setBalance(null);
    }
  };

  const loadActiveGame = async () => {
    if (!program) return;
    const games = await program.account.gameState.all();
    const active = games.find(g => g.account.active);
    setGame(active?.account || null);
  };

  const initialize = async () => {
    if (!program || !wallet) return;
    setLoading(true);
    try {
      await program.methods.initialize(wallet)
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('Game initialized!');
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  };

  const deposit = async () => {
    if (!program || !wallet || !betAmount) return;
    const lamports = Math.floor(parseFloat(betAmount) * 1e9);
    setLoading(true);
    try {
      await program.methods.deposit(new BN(lamports))
        .accounts({ userBalance: userPda, user: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('Deposited!');
      setBetAmount('');
      loadBalance();
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  };

  const createGame = async () => {
    if (!program || !wallet || !multiplier) return;
    const mult = Math.floor(parseFloat(multiplier) * 100);
    const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from('game'), Buffer.from(gameName)], program.programId);
    setLoading(true);
    try {
      await program.methods.createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('Game created!');
      loadActiveGame();
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  };

  const placeBet = async () => {
    if (!program || !wallet || !betAmount || !game) return;
    const lamports = Math.floor(parseFloat(betAmount) * 1e9);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), wallet.toBytes()], program.programId);
    setLoading(true);
    try {
      await program.methods.placeBet(wallet, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userPda, gameState: game.gameId, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('Bet placed!');
      setBetAmount('');
      loadBalance();
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-4xl font-bold text-center mb-8">CRASH GAME</h1>

        {!connected ? (
          <p className="text-center text-yellow-300">Connect wallet</p>
        ) : !balance ? (
          <div className="space-y-4">
            <button onClick={initialize} className="w-full p-4 bg-purple-700 rounded-lg font-bold">INITIALIZE</button>
            <button onClick={deposit} className="w-full p-4 bg-green-600 rounded-lg font-bold">DEPOSIT</button>
          </div>
        ) : (
          <>
            <div className="bg-white/10 p-6 rounded-xl text-center mb-6">
              <p>Balance: {(balance.balance / 1e9).toFixed(4)} SOL</p>
            </div>

            {!game ? (
              <div className="space-y-4">
                <input placeholder="Multiplier (e.g. 2.0)" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <input placeholder="Game Name" value={gameName} onChange={e => setGameName(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <button onClick={createGame} disabled={loading} className="w-full p-4 bg-purple-600 rounded-lg font-bold">
                  {loading ? 'Creating...' : 'CREATE GAME'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center">Active: {game.gameName} @ {game.multiplier / 100}x</p>
                <input placeholder="Bet Amount (SOL)" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                <button onClick={placeBet} disabled={loading} className="w-full p-4 bg-red-600 rounded-lg font-bold">
                  {loading ? 'Betting...' : 'PLACE BET'}
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