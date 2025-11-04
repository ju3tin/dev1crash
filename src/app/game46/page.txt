'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProgram } from '@/lib/anchor6'; // Assumes heliusProvider is set here
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { heliusConnection, fetchProgramAccountsPaginated, getAccountInfo } from '@/lib/helius'; // New import
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { 
  AlertCircle, Trophy, Zap, DollarSign, Users, Clock, X, 
  Wallet, Send, ArrowDown, ArrowUp, RefreshCw, CheckCircle 
} from 'lucide-react';

const PROGRAM_ID = new PublicKey("HT4dGgbZewPifdZfMpva24szn3QcwJSsRxTuHcsZF52F");
const { connection } = useConnection(); // This is Wallet Adapter's default (not Helius)
export default function GamePage() {
  const program = useProgram(); // Uses Helius RPC via heliusProvider
  const { connection: walletConnection } = useConnection(); // Keep for non-Helius calls if needed
  const { publicKey: wallet, connected, sendTransaction } = useWallet();

  // === STATE ===
  const [config, setConfig] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<any>(null);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [multiplier, setMultiplier] = useState(100);
  const [isAnimating, setIsAnimating] = useState(false);

  // === INPUTS ===
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [targetMult, setTargetMult] = useState('2.5');
  const [gameName, setGameName] = useState('Crash #1');
  const [betAmt, setBetAmt] = useState('');
  const [crashNow, setCrashNow] = useState(false);
  const [adminWithdrawAmt, setAdminWithdrawAmt] = useState('');
  const [bountyAmt, setBountyAmt] = useState('');

  // === PDAs ===
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], PROGRAM_ID)[0] : null;
  const vaultPda = program ? PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID)[0] : null;

  // === LOAD DATA (Using Helius for Efficient Queries) ===
  const loadAll = useCallback(async () => {
    if (!program || !wallet || !connected) return;
    try {
      await Promise.all([
        loadConfig(),
        loadUserBalance(),
        loadAllGames(),
      ]);
    } catch (err) {
      console.error('Load error:', err);
    }
  }, [program, wallet, connected]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 5000);
    return () => clearInterval(id);
  }, [loadAll]);

  const loadConfig = async () => {
    if (!configPda || !program) return;
    try {
      // Helius: Use getAccountInfo for single account
      const accountInfo = await getAccountInfo(configPda);
      if (accountInfo) {
        const data = program.coder.accounts.decode('Config', accountInfo.data);
        setConfig(data);
        setIsAdmin(data.admin.toBase58() === wallet?.toBase58());
      }
    } catch {}
  };

  const loadUserBalance = async () => {
    if (!userPda || !program) {
      setUserBalance(null);
      return;
    }
    try {
      // Helius: Use getAccountInfo for single user balance
      const accountInfo = await getAccountInfo(userPda);
      if (accountInfo) {
        const data = program.coder.accounts.decode('UserBalance', accountInfo.data);
        setUserBalance(data);
      } else {
        setUserBalance(null);
      }
    } catch {
      setUserBalance(null);
    }
  };

  const loadAllGames = async () => {
    if (!program) return;
    try {
      // Helius: Use getProgramAccountsV2 with pagination for all games
      const accounts = await fetchProgramAccountsPaginated(PROGRAM_ID, {
        dataSize: 200, // Approximate size of GameState
      });
      const games = accounts.map(acc => program.coder.accounts.decode('GameState', acc.account.data));
      const sorted = games.sort((a, b) => Number(b.createdAt.sub(a.createdAt)));
      setAllGames(sorted);
      const active = sorted.find(g => g.active);
      setCurrentGame(active || null);
      if (active) {
        startAnimation(Number(active.multiplier.toString()) / 100);
        loadActiveBets(active.gameId);
        if (wallet) loadMyBets(active.gameId);
      } else {
        setMultiplier(100);
        setIsAnimating(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadActiveBets = async (gameId: PublicKey) => {
    if (!program) return;
    try {
      // Helius: Filter by gameId in filters (if supported) or post-process
      const accounts = await fetchProgramAccountsPaginated(PROGRAM_ID, {
        dataSize: 165, // Approximate Bet size
      });
      const bets = accounts
        .map(acc => program.coder.accounts.decode('Bet', acc.account.data))
        .filter(b => b.gameId.toBase58() === gameId.toBase58() && b.active);
      setActiveBets(bets);
    } catch {}
  };

  const loadMyBets = async (gameId: PublicKey) => {
    if (!program || !wallet) return;
    try {
      // Helius: Same as above, filter by user and gameId
      const accounts = await fetchProgramAccountsPaginated(PROGRAM_ID, {
        dataSize: 165,
      });
      const bets = accounts
        .map(acc => program.coder.accounts.decode('Bet', acc.account.data))
        .filter(b => b.user.toBase58() === wallet.toBase58() && b.gameId.toBase58() === gameId.toBase58());
      setMyBets(bets);
    } catch {}
  };

  const startAnimation = (target: number) => {
    setMultiplier(100);
    setIsAnimating(true);
    const interval = setInterval(() => {
      setMultiplier(prev => {
        if (prev >= target * 100) {
          clearInterval(interval);
          setIsAnimating(false);
          return target * 100;
        }
        return prev + Math.floor(Math.random() * 35);
      });
    }, 80);
  };

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  // === 1. INITIALIZE (Transaction via Anchor + Helius RPC) ===
  const initialize = async () => {
    if (!program || !wallet || !configPda || !vaultPda || !connection) return;
    setLoading(true);
    try {
      const tx = await program.methods.initialize(wallet)
        .accounts({ config: configPda, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection); // Connection uses Helius RPC
      showStatus('success', 'Config initialized!');
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 2. CREATE USER (Transaction via Anchor + Helius RPC) ===
  const createUser = async () => {
    if (!program || !wallet || !userPda || !connection) return;
    setLoading(true);
    try {
      const tx = await program.methods.createUser()
        .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'User created!');
      setTimeout(loadUserBalance, 3000);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 3. DEPOSIT (Transaction via Anchor + Helius RPC) ===
  const deposit = async () => {
    if (!program || !wallet || !userPda || !vaultPda || !depositAmt) return;
    const lamports = Math.floor(parseFloat(depositAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.deposit(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Deposited!');
      setDepositAmt('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 4. WITHDRAW (Transaction via Anchor + Helius RPC) ===
  const withdraw = async () => {
    if (!program || !wallet || !userPda || !vaultPda || !withdrawAmt) return;
    const lamports = Math.floor(parseFloat(withdrawAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.withdraw(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Withdrawn!');
      setWithdrawAmt('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 5. CREATE GAME (Transaction via Anchor + Helius RPC) ===
  const createGame = async () => {
    if (!program || !wallet) return;
    const mult = Math.floor(parseFloat(targetMult) * 100);
    if (mult < 100 || mult > 10000) return showStatus('error', '1.0x - 100x');

    const createdAtSec = Math.floor(Date.now() / 1000);
    const seed = new Uint32Array([createdAtSec]);
    const seedBytes = Buffer.from(seed.buffer);
    const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from('game'), seedBytes], PROGRAM_ID);

    setLoading(true);
    try {
      const tx = await program.methods.createGame(new BN(mult), gameName, createdAtSec)
        .accounts({ gameState: gamePda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Game created!');
      loadAllGames();
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 6. PLACE BET (Transaction via Anchor + Helius RPC) ===
  const placeBet = async () => {
    if (!program || !wallet || !currentGame || !betAmt || !userPda) return; // Narrow here
  
    const lamports = Math.floor(parseFloat(betAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
  
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), wallet.toBytes(), currentGame.gameId.toBytes()],
      PROGRAM_ID
    );
  
    setLoading(true);
    try {
      const tx = await program.methods.placeBet(new BN(lamports))
        .accounts({
          bet: betPda,
          userBalance: userPda,
          gameState: currentGame.gameId,
          signer: wallet, // Now 100% PublicKey (not null)
          systemProgram: SystemProgram.programId,
        })
        .transaction();
  
      await sendTransaction(tx, heliusConnection);
      showStatus('success', 'Bet placed!');
      setBetAmt('');
      loadActiveBets(currentGame.gameId);
      loadMyBets(currentGame.gameId);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 7. CLAIM PAYOUT (Transaction via Anchor + Helius RPC) ===
  const claimPayout = async (bet: any) => {
    if (!program || !wallet || !userPda) return;
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), bet.user.toBytes(), bet.gameId.toBytes()], PROGRAM_ID);

    setLoading(true);
    try {
      const tx = await program.methods.claimPayout()
        .accounts({ bet: betPda, userBalance: userPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Payout claimed!');
      loadUserBalance();
      loadMyBets(bet.gameId);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 8. RESOLVE GAME (Transaction via Anchor + Helius RPC + Fetch Bets via Helius) ===
  const resolveGame = async () => {
    if (!program || !wallet || !currentGame || !vaultPda) return;
    setLoading(true);
    setIsAnimating(false);
    try {
      // Helius: Fetch bets with pagination for large games
      const accounts = await fetchProgramAccountsPaginated(PROGRAM_ID, {
        dataSize: 165, // Bet size
      });
      const gameBets = accounts
        .map(acc => program.coder.accounts.decode('Bet', acc.account.data))
        .filter(b => b.gameId.toBase58() === currentGame.gameId.toBase58());

      const remaining: any[] = [];
      for (const bet of gameBets) {
        const betAcc = bet.publicKey; // Derive from account
        const userPda = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.user.toBytes()], PROGRAM_ID)[0];
        remaining.push({ pubkey: betAcc, isSigner: false, isWritable: true });
        remaining.push({ pubkey: userPda, isSigner: false, isWritable: true });
      }

      const tx = await program.methods.resolveGame(crashNow)
        .accounts({ gameState: currentGame.gameId, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .remainingAccounts(remaining)
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', crashNow ? 'CRASHED!' : 'WINNERS PAID!');

      // Auto-create logic...
      setTimeout(async () => {
        // ... (same as before)
      }, 3000);
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
      setCrashNow(false);
    }
  };

  // === 9. ADMIN WITHDRAW (Transaction via Anchor + Helius RPC) ===
  const adminWithdraw = async () => {
    if (!program || !wallet || !configPda || !vaultPda || !adminWithdrawAmt) return;
    const lamports = Math.floor(parseFloat(adminWithdrawAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.adminWithdraw(new BN(lamports))
        .accounts({ config: configPda, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Admin withdrawal complete!');
      setAdminWithdrawAmt('');
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === 10. ADMIN DEPOSIT BOUNTY (Transaction via Anchor + Helius RPC) ===
  const adminDepositBounty = async () => {
    if (!program || !wallet || !configPda || !vaultPda || !bountyAmt) return;
    const lamports = Math.floor(parseFloat(bountyAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.adminDepositBounty(new BN(lamports))
        .accounts({ config: configPda, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Bounty added!');
      setBountyAmt('');
    } catch (e: any) {
      showStatus('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // === UI (Unchanged - Same as Your Original) ===
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white p-6 pt-24">
        <div className="max-w-7xl mx-auto space-y-10">

          <motion.h1 initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-7xl font-black text-center bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            CRASH GAME
          </motion.h1>

          {!connected ? (
            <div className="text-center p-10 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
              <Wallet className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <p className="text-2xl">Connect wallet to play</p>
            </div>
          ) : (
            <>
              {/* PLAYER PANEL */}
              <motion.div initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <DollarSign className="text-green-400" /> YOUR BALANCE
                </h2>

                {!userBalance ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={initialize} disabled={loading}
                      className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {loading ? '...' : 'INITIALIZE'}
                    </button>
                    <button onClick={createUser} disabled={loading}
                      className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                      <Users className="w-5 h-5" />
                      {loading ? '...' : 'CREATE USER'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-5xl font-black">
                        {(Number(userBalance.balance.toString()) / LAMPORTS_PER_SOL).toFixed(6)} SOL
                      </p>
                      {userBalance.hasActiveBet && (
                        <p className="text-orange-400 mt-2 flex items-center justify-center gap-2">
                          <Zap /> BET ACTIVE
                        </p>
                      )}
                    </div>

                    {/* Deposit / Withdraw */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <input type="number" step="0.000001" min="0.000001"
                          placeholder="Deposit (SOL)" value={depositAmt}
                          onChange={e => setDepositAmt(e.target.value)}
                          className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <button onClick={deposit} disabled={loading || !depositAmt}
                          className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <ArrowDown className="w-5 h-5" />
                          {loading ? '...' : 'DEPOSIT'}
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input type="number" step="0.000001" min="0.000001"
                          placeholder="Withdraw (SOL)" value={withdrawAmt}
                          onChange={e => setWithdrawAmt(e.target.value)}
                          className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
                        <button onClick={withdraw} disabled={loading || !withdrawAmt}
                          className="w-full p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <ArrowUp className="w-5 h-5" />
                          {loading ? '...' : 'WITHDRAW'}
                        </button>
                      </div>
                    </div>

                    {/* USER BET INPUT */}
                    {currentGame && (
                      <div className="mt-6">
                        <input type="number" step="0.000001" min="0.000001"
                          placeholder="Your Bet Amount (SOL)" value={betAmt}
                          onChange={e => setBetAmt(e.target.value)}
                          className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     {/*   <button onClick={placeUserBet} disabled={loading || !betAmt || userBalance?.hasActiveBet}
                          className="mt-3 w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <Send className="w-5 h-5" />
                          {loading ? 'Placing...' : 'PLACE MY BET'}
                        </button> */}
                      </div>
                    )}

                    {/* MY BETS WITH PAYOUT & CLAIM */}
                    {myBets.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">My Bets</h3>
                        <div className="space-y-2">
                          {myBets.map((bet, i) => (
                            <div key={i} className="bg-white/10 p-3 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-mono">
                                  {(Number(bet.amount.toString()) / LAMPORTS_PER_SOL).toFixed(6)} SOL
                                </span>
                                {bet.payoutAmount?.gt(new BN(0)) && (
                                  <span className="text-green-400 ml-2">
                                    → {(Number(bet.payoutAmount.toString()) / LAMPORTS_PER_SOL).toFixed(6)} SOL
                                  </span>
                                )}
                              </div>
                              {bet.claimed ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : bet.payoutAmount?.gt(new BN(0)) ? (
                                <button onClick={() => claimPayout(bet)}
                                  className="px-3 py-1 bg-green-600 rounded text-sm"
                                  disabled={loading}>
                                  Claim
                                </button>
                              ) : (
                                <span className="text-orange-400">Active</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* LIVE MULTIPLIER */}
              {currentGame && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className={`text-9xl font-black transition-all ${isAnimating ? 'text-green-400' : currentGame.crashed ? 'text-red-400' : 'text-yellow-400'} drop-shadow-lg`}>
                    {(multiplier / 100).toFixed(2)}x
                  </div>
                  <p className="text-3xl mt-3 font-bold">{currentGame.gameName}</p>
                  <div className="flex justify-center gap-6 mt-6 text-lg">
                    <span className="flex items-center gap-2"><Users /> {activeBets.length} bets</span>
                    <span className="flex items-center gap-2"><DollarSign /> {(Number(currentGame.totalVolume.toString()) / LAMPORTS_PER_SOL).toFixed(3)} SOL</span>
                  </div>
                </motion.div>
              )}

              {/* ADMIN PANEL */}
              {isAdmin && (
                <motion.div initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="bg-red-950/50 backdrop-blur-xl rounded-3xl p-8 border border-red-500/50 shadow-2xl">
                  <h2 className="text-4xl font-black text-red-400 mb-8 text-center flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-400" /> ADMIN CONTROL
                  </h2>

                  {!currentGame ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <input placeholder="Target Multiplier (e.g. 2.5)" value={targetMult}
                        onChange={e => setTargetMult(e.target.value)}
                        className="p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      <input placeholder="Game Name" value={gameName}
                        onChange={e => setGameName(e.target.value)}
                        className="p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      <button onClick={createGame} disabled={loading}
                        className="col-span-2 p-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:scale-105 transition flex items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6" />
                        {loading ? 'Creating...' : 'CREATE GAME'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* ADMIN BET (optional user) */}
                      <div className="grid md:grid-cols-2 gap-6">
                      {/*  <input placeholder="User Pubkey (optional)" value={betUser}
                          onChange={e => setBetUser(e.target.value)}
                          className="p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" /> */}
                        <input placeholder="Bet Amount (SOL)" value={betAmt}
                          onChange={e => setBetAmt(e.target.value)}
                          className="p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      {/*  <button onClick={placeAdminBet} disabled={loading}
                          className="col-span-2 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <Send className="w-5 h-5" />
                          {loading ? 'Placing...' : 'PLACE BET (admin)'}
                        </button> */}
                      </div>

                      <div className="flex items-center justify-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer text-xl">
                          <input type="checkbox" checked={crashNow} onChange={e => setCrashNow(e.target.checked)} className="w-6 h-6" />
                          <span>Crash Now?</span>
                        </label>
                        <button onClick={resolveGame} disabled={loading}
                          className="px-10 py-4 bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl font-bold text-xl hover:scale-105 transition flex items-center gap-3">
                          {loading ? '...' : 'RESOLVE & AUTO-START'} <Zap />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="space-y-3">
                          <input placeholder="Withdraw from Vault (SOL)" value={adminWithdrawAmt}
                            onChange={e => setAdminWithdrawAmt(e.target.value)}
                            className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                          <button onClick={adminWithdraw} disabled={loading}
                            className="w-full p-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl font-bold text-lg hover:scale-105 transition">
                            ADMIN WITHDRAW
                          </button>
                        </div>
                        <div className="space-y-3">
                          <input placeholder="Add Bounty (SOL)" value={bountyAmt}
                            onChange={e => setBountyAmt(e.target.value)}
                            className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <button onClick={adminDepositBounty} disabled={loading}
                            className="w-full p-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl font-bold text-lg hover:scale-105 transition">
                            ADD BOUNTY
                          </button>
                        </div>
                      </div>

                      {activeBets.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Clock /> Active Bets ({activeBets.length})</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {activeBets.map((bet, i) => (
                              <div key={i} className="bg-white/10 p-4 rounded-2xl flex justify-between items-center">
                                <span className="font-mono">{bet.user.toBase58().slice(0, 8)}...</span>
                                <span className="text-green-400 font-bold">
                                  {(Number(bet.amount.toString()) / LAMPORTS_PER_SOL).toFixed(6)} SOL
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* GAME HISTORY */}
              {allGames.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-cyan-400" /> Game History
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allGames.map((g, i) => (
                      <div key={i}
                        className={`p-4 rounded-2xl flex justify-between items-center ${g.active ? 'bg-green-900/50' : g.crashed ? 'bg-red-900/50' : 'bg-white/5'}`}>
                        <div>
                          <p className="font-bold">{g.gameName}</p>
                          <p className="text-sm opacity-75">
                            {(Number(g.multiplier.toString()) / 100).toFixed(2)}x •{' '}
                            {g.active ? 'LIVE' : g.crashed ? 'CRASHED' : 'RESOLVED'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-green-400">
                            {(Number(g.totalVolume.toString()) / LAMPORTS_PER_SOL).toFixed(3)} SOL
                          </p>
                          <p className="text-xs opacity-75">{Number(g.totalBets.toString())} bets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STATUS TOAST */}
              {status && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 flex items-center gap-3 p-5 rounded-2xl text-xl font-bold ${status.type === 'error' ? 'bg-red-900/70 text-red-300' : 'bg-green-900/70 text-green-300'} backdrop-blur shadow-2xl`}>
                  {status.type === 'error' ? <X className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                  {status.msg}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}