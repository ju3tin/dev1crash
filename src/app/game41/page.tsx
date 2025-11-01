'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProgram } from '@/lib/anchor2';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  const program = useProgram();
  const { publicKey: wallet, connected } = useWallet();
  const [userBalance, setUserBalance] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState('2.0');
  const [gameName, setGameName] = useState('Crash #1');
  const [betUser, setBetUser] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [crashed, setCrashed] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // PDAs - use useMemo to prevent hydration mismatches
  const configPda = useMemo(() => {
    if (!program || !mounted) return null;
    return PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0];
  }, [program, mounted]);

  const userPda = useMemo(() => {
    if (!program || !wallet || !mounted) return null;
    return PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId)[0];
  }, [program, wallet, mounted]);

  const gamePda = useMemo(() => {
    if (!program || !wallet || !mounted) return null;
    return PublicKey.findProgramAddressSync([Buffer.from('game_state'), wallet.toBytes()], program.programId)[0];
  }, [program, wallet, mounted]);

  useEffect(() => {
    if (!program || !wallet || !connected) return;
    checkAdmin();
    loadUserBalance();
    loadActiveGame();
  }, [program, wallet, connected]);

  const checkAdmin = async () => {
    if (!program || !configPda) return;
    try {
      const config = await program.account.config.fetch(configPda);
      setIsAdmin(config.admin.toBase58() === wallet?.toBase58());
    } catch {
      setIsAdmin(false);
    }
  };

  const loadUserBalance = async () => {
    if (!program || !userPda) return;
    const info = await program.provider.connection.getAccountInfo(userPda);
    if (!info) {
      setUserBalance(null);
      return;
    }
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
    if (!program || !configPda) return;
    setLoading(true);
    try {
      const sig = await program.methods
        .initialize(wallet!)
        .accounts({ config: configPda, signer: wallet!, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Initialized! Tx: ${sig.slice(0, 8)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!program || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) {
      setStatus('Min: 0.000001 SOL');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods
        .deposit(new BN(lamports))
        .accounts({
          userBalance: userPda,
          user: wallet!,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(`Deposited! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    if (!program || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) {
      setStatus('Min: 0.000001 SOL');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods
        .withdraw(new BN(lamports))
        .accounts({
          userBalance: userPda,
          user: wallet!,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(`Withdrawn! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!program || !gamePda || !configPda) return;
    const mult = Math.floor(parseFloat(multiplier) * 100);
    if (mult < 100 || mult > 10000) {
      setStatus('1.0x - 100x');
      return;
    }
    setLoading(true);
    try {
      const sig = await program.methods
        .createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet!, systemProgram: SystemProgram.programId })
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
    if (!program || !gamePda || !configPda || !betUser || !betAmount) return;
    const lamports = Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return;
    const userPubkey = new PublicKey(betUser);
    const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), userPubkey.toBytes()], program.programId);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), userPubkey.toBytes(), gamePda.toBytes()], program.programId);

    setLoading(true);
    try {
      const sig = await program.methods
        .placeBet(userPubkey, new BN(lamports))
        .accounts({
          bet: betPda,
          userBalance: userBalancePda,
          gameState: gamePda,
          config: configPda,
          signer: wallet!,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(`Bet placed! Tx: ${sig.slice(0, 8)}...`);
      setBetUser('');
      setBetAmount('');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveGame = async () => {
    if (!program || !gameState || !gamePda || !configPda) return;
    const bets = await program.account.bet.all();
    const gameBets = bets.filter(b => b.account.gameId.toBase58() === gamePda.toBase58() && b.account.active);
    setLoading(true);
    try {
      for (const bet of gameBets) {
        const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.account.user.toBytes()], program.programId);
        await program.methods
          .resolveGame(crashed)
          .accounts({
            gameState: gamePda,
            bet: bet.publicKey,
            userBalance: userBalancePda,
            config: configPda,
            signer: wallet!,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }
      setStatus(crashed ? 'Crashed!' : 'Players won!');
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 pt-24 space-y-8">
          <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CRASH GAME
          </h1>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-24 space-y-8">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          CRASH GAME
        </h1>

        {!connected ? (
          <p className="text-center text-yellow-300 text-xl">Connect wallet</p>
        ) : (
          <>
            {/* PLAYER SECTION */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4">YOUR BALANCE</h2>
              {!userBalance ? (
                <div className="space-y-4">
                  <button onClick={initialize} disabled={loading} className="w-full p-4 bg-purple-700 rounded-lg font-bold">
                    {loading ? 'Initializing...' : 'INITIALIZE'}
                  </button>

                  <input
                    type="number"
                    placeholder="Deposit (SOL)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-white/10 rounded text-white"
                    step="0.000001"
                    min="0.000001"
                  />

                  <button onClick={deposit} disabled={loading || !amount} className="w-full p-4 bg-green-600 rounded-lg font-bold">
                    {loading ? 'Depositing...' : 'DEPOSIT'}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-3xl font-bold">{(userBalance.balance / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  {userBalance.hasActiveBet && <p className="text-yellow-300">Bet Active</p>}

                  <input
                    type="number"
                    placeholder="Withdraw (SOL)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-white/10 rounded text-white"
                    step="0.000001"
                    min="0.000001"
                  />

                  <button onClick={withdraw} disabled={loading || !amount} className="w-full p-4 bg-red-600 rounded-lg font-bold">
                    {loading ? 'Withdrawing...' : 'WITHDRAW'}
                  </button>
                </div>
              )}
            </div>

            {/* GAME STATUS */}
            {gameState && (
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 text-center">
                <p className="text-2xl font-bold">{gameState.gameName}</p>
                <p className="text-4xl font-bold text-green-400">{(gameState.multiplier / 100).toFixed(2)}x</p>
              </div>
            )}

            {/* ADMIN PANEL */}
            {isAdmin && (
              <div className="bg-red-900/50 backdrop-blur rounded-2xl p-6 border border-red-500/50">
                <h2 className="text-2xl font-bold text-red-300 mb-4">ADMIN</h2>

                {!gameState ? (
                  <div className="space-y-4">
                    <input placeholder="Multiplier" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                    <input placeholder="Name" value={gameName} onChange={(e) => setGameName(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                    <button onClick={createGame} disabled={loading} className="w-full p-4 bg-purple-600 rounded font-bold">
                      {loading ? 'Creating...' : 'CREATE GAME'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <input placeholder="User Pubkey" value={betUser} onChange={(e) => setBetUser(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                      <input placeholder="Bet Amount" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
                      <button onClick={placeBet} disabled={loading} className="w-full p-3 bg-green-600 rounded font-bold">
                        {loading ? 'Placing...' : 'PLACE BET'}
                      </button>
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={crashed} onChange={(e) => setCrashed(e.target.checked)} />
                      <span>Crash?</span>
                    </label>
                    <button onClick={resolveGame} disabled={loading} className="w-full mt-3 p-4 bg-red-600 rounded font-bold">
                      {loading ? 'Resolving...' : 'RESOLVE'}
                    </button>
                  </>
                )}
              </div>
            )}

            {status && (
              <p className={`text-center p-4 rounded-lg text-lg ${status.includes('Error') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                {status}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}