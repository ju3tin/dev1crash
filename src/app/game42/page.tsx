'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor2';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function GamePage() {
  const program = useProgram();
  const { connection } = useConnection();
  const { publicKey: wallet, connected, sendTransaction } = useWallet();

  // === STATE ===
  const [config, setConfig] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [multiplier, setMultiplier] = useState(0);
  const [isCrashing, setIsCrashing] = useState(false);

  // === INPUTS ===
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [gameMultiplier, setGameMultiplier] = useState('2.0');
  const [gameName, setGameName] = useState('Crash #1');
  const [betUser, setBetUser] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [crashNow, setCrashNow] = useState(false);

  // === PDAs ===
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId)[0] : null;
  const vaultPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('vault'), wallet.toBytes()], program.programId)[0] : null;
  const gamePda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('game_state'), wallet.toBytes()], program.programId)[0] : null;

  // === EFFECTS ===
  useEffect(() => {
    if (!program || !wallet || !connected) return;
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [program, wallet, connected]);

  const loadAll = async () => {
    if (!program) return;
    await Promise.all([
      loadConfig(),
      loadUserBalance(),
      loadActiveGame(),
      loadActiveBets(),
    ]);
  };

  const loadConfig = async () => {
    if (!configPda || !program) return;
    try {
      const data = await program.account.config.fetch(configPda);
      setConfig(data);
      setIsAdmin(data.admin.toBase58() === wallet?.toBase58());
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const loadUserBalance = async () => {
    if (!userPda || !program) return;
    const info = await connection.getAccountInfo(userPda);
    if (!info) {
      setUserBalance(null);
      return;
    }
    try {
      const data = await program.account.userBalance.fetch(userPda);
      setUserBalance(data);
    } catch (err) {
      console.error("Failed to fetch user balance:", err);
      setUserBalance(null);
    }
  };

  const loadActiveGame = async () => {
    if (!gamePda || !program) return;
    try {
      const data = await program.account.gameState.fetch(gamePda);
      if (data.active) {
        setGameState(data);
        startMultiplierAnimation(data.multiplier);
      } else {
        setGameState(null);
        setMultiplier(0);
      }
    } catch (err) {
      console.error("Failed to load game:", err);
      setGameState(null);
    }
  };

  const loadActiveBets = async () => {
    if (!gameState || !program || !gamePda) return;
    try {
      const bets = await program.account.bet.all();
      const active = bets.filter(b => 
        b.account.gameId.toBase58() === gamePda.toBase58() && 
        b.account.active
      );
      setActiveBets(active.map(b => b.account));
    } catch (err) {
      console.error("Failed to load bets:", err);
    }
  };

  const startMultiplierAnimation = (target: number) => {
    setMultiplier(100);
    setIsCrashing(false);
    const interval = setInterval(() => {
      setMultiplier(prev => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + Math.floor(Math.random() * 15);
      });
    }, 50);
  };

  // === INSTRUCTIONS ===
  const initialize = async () => {
    if (!configPda || !program || !wallet) return;
    setLoading(true);
    try {
      const tx = await program.methods
        .initialize(wallet)
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`Initialized! ${sig.slice(0, 8)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!userPda || !program || !wallet) return;
    setLoading(true);
    try {
      const tx = await program.methods
        .createUser()
        .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`User created! ${sig.slice(0, 8)}...`);
      setTimeout(loadUserBalance, 3000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!userPda || !vaultPda || !program || !wallet || !depositAmount) return;
    const lamports = Math.floor(parseFloat(depositAmount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return setStatus('Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods
        .deposit(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`Deposited! ${sig.slice(0, 8)}...`);
      setDepositAmount('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    if (!userPda || !vaultPda || !program || !wallet || !withdrawAmount) return;
    const lamports = Math.floor(parseFloat(withdrawAmount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return setStatus('Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods
        .withdraw(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`Withdrawn! ${sig.slice(0, 8)}...`);
      setWithdrawAmount('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!gamePda || !configPda || !program || !wallet) return;
    const mult = Math.floor(parseFloat(gameMultiplier) * 100);
    if (mult < 100 || mult > 10000) return setStatus('1.0x - 100x');
    setLoading(true);
    try {
      const tx = await program.methods
        .createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`Game created! ${sig.slice(0, 8)}...`);
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!gamePda || !configPda || !program || !wallet || !betUser || !betAmount) return;
    const lamports = Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return;
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(betUser);
    } catch {
      return setStatus('Invalid pubkey');
    }
    const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), userPubkey.toBytes()], program.programId);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), userPubkey.toBytes(), gamePda.toBytes()], program.programId);

    setLoading(true);
    try {
      const tx = await program.methods
        .placeBet(userPubkey, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userBalancePda, gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      const sig = await sendTransaction(tx, connection);
      setStatus(`Bet placed! ${sig.slice(0, 8)}...`);
      setBetUser('');
      setBetAmount('');
      loadActiveBets();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveGame = async () => {
    if (!gameState || !gamePda || !configPda || !program || !wallet) return;
    setLoading(true);
    setIsCrashing(true);
    try {
      const bets = await program.account.bet.all();
      const gameBets = bets.filter(b => b.account.gameId.toBase58() === gamePda.toBase58() && b.account.active);
      
      for (const bet of gameBets) {
        const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.account.user.toBytes()], program.programId);
        const tx = await program.methods
          .resolveGame(crashNow)
          .accounts({ gameState: gamePda, bet: bet.publicKey, userBalance: userBalancePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
          .transaction();
        await sendTransaction(tx, connection);
      }
      
      setStatus(crashNow ? 'CRASHED!' : 'PLAYERS WON!');
      setTimeout(() => {
        loadActiveGame();
        setIsCrashing(false);
      }, 2000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // === UI ===
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white p-6 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* HEADER */}
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            CRASH GAME
          </motion.h1>

          {/* CONNECTION */}
          {!connected ? (
            <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur">
              <p className="text-2xl text-yellow-300">Connect your wallet to play</p>
            </div>
          ) : (
            <>
              {/* PLAYER PANEL */}
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold mb-4">YOUR BALANCE</h2>
                
                {!userBalance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={initialize} disabled={loading || !program} className="p-4 bg-purple-700 rounded-xl font-bold hover:bg-purple-600 transition">
                      {loading ? '...' : 'INITIALIZE'}
                    </button>
                    <button onClick={createUser} disabled={loading || !program} className="p-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition">
                      {loading ? '...' : 'CREATE USER'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold">{(userBalance.balance / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                      {userBalance.hasActiveBet && <p className="text-yellow-400 mt-2">BET ACTIVE</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          placeholder="Deposit (SOL)"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400"
                          step="0.000001"
                          min="0.000001"
                        />
                        <button onClick={deposit} disabled={loading || !depositAmount || !program} className="w-full mt-2 p-3 bg-green-600 rounded-lg font-bold hover:bg-green-500 transition">
                          {loading ? '...' : 'DEPOSIT'}
                        </button>
                      </div>

                      <div>
                        <input
                          type="number"
                          placeholder="Withdraw (SOL)"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400"
                          step="0.000001"
                          min="0.000001"
                        />
                        <button onClick={withdraw} disabled={loading || !withdrawAmount || !program} className="w-full mt-2 p-3 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition">
                          {loading ? '...' : 'WITHDRAW'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* MULTIPLIER DISPLAY */}
              {gameState && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className={`text-8xl font-bold transition-all duration-100 ${isCrashing ? 'text-red-500' : 'text-green-400'}`}>
                    {(multiplier / 100).toFixed(2)}x
                  </div>
                  <p className="text-2xl mt-2">{gameState.gameName}</p>
                </motion.div>
              )}

              {/* ADMIN PANEL */}
              {isAdmin && (
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-red-900/50 backdrop-blur rounded-2xl p-6 border border-red-500/50"
                >
                  <h2 className="text-3xl font-bold text-red-300 mb-6 text-center">ADMIN CONTROL</h2>

                  {!gameState ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        placeholder="Multiplier (e.g. 2.0)"
                        value={gameMultiplier}
                        onChange={(e) => setGameMultiplier(e.target.value)}
                        className="p-3 bg-white/10 rounded-lg"
                      />
                      <input
                        placeholder="Game Name"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        className="p-3 bg-white/10 rounded-lg"
                      />
                      <button onClick={createGame} disabled={loading || !program} className="col-span-2 p-4 bg-purple-600 rounded-xl font-bold hover:bg-purple-500 transition">
                        {loading ? 'Creating...' : 'CREATE GAME'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="User Pubkey"
                          value={betUser}
                          onChange={(e) => setBetUser(e.target.value)}
                          className="p-3 bg-white/10 rounded-lg"
                        />
                        <input
                          placeholder="Bet Amount (SOL)"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="p-3 bg-white/10 rounded-lg"
                        />
                        <button onClick={placeBet} disabled={loading || !program} className="col-span-2 p-3 bg-green-600 rounded-lg font-bold hover:bg-green-500 transition">
                          {loading ? 'Placing...' : 'PLACE BET'}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={crashNow} onChange={(e) => setCrashNow(e.target.checked)} className="w-5 h-5" />
                          <span className="text-xl">Crash Now?</span>
                        </label>
                        <button onClick={resolveGame} disabled={loading || !program} className="px-8 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition text-xl">
                          {loading ? '...' : 'RESOLVE GAME'}
                        </button>
                      </div>

                      {/* ACTIVE BETS */}
                      {activeBets.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-xl font-bold mb-3">Active Bets ({activeBets.length})</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {activeBets.map((bet, i) => (
                              <div key={i} className="bg-white/10 p-3 rounded-lg flex justify-between">
                                <span>{bet.user.toBase58().slice(0, 8)}...</span>
                                <span className="text-green-400">{(bet.amount / LAMPORTS_PER_SOL).toFixed(6)} SOL</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STATUS */}
              {status && (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`text-center p-4 rounded-xl text-xl font-bold ${status.includes('Error') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}
                >
                  {status}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}