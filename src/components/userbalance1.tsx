'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProgram } from '@/lib/anchor7';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
  AlertCircle, Trophy, Zap, DollarSign, Users, Clock, X,
  Wallet, Send, ArrowDown, ArrowUp, RefreshCw, CheckCircle
} from 'lucide-react';

const PROGRAM_ID = new PublicKey("C3aRucgPgxHHD5nrT4busuTTnVmF55gqJwAccQwr8Qi4");

export default function GamePage() {
  const program = useProgram();
  const { connection } = useConnection();
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
  const [betUser, setBetUser] = useState('');          // admin optional pubkey
  const [betAmt, setBetAmt] = useState('');
  const [crashNow, setCrashNow] = useState(false);
  const [adminWithdrawAmt, setAdminWithdrawAmt] = useState('');
  const [bountyAmt, setBountyAmt] = useState('');
  // NEW INPUTS FOR MISSING INSTRUCTIONS
  const [adminSetAdmin, setAdminSetAdmin] = useState('');
  const [adminSetFeeBps, setAdminSetFeeBps] = useState('');
  const [adminPause, setAdminPause] = useState(false);
  const [adminResume, setAdminResume] = useState(false);

  // === PDAs ===
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], PROGRAM_ID)[0] : null;
  const vaultPda = program ? PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID)[0] : null;

  // === HELPERS ===
  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  // === DATA LOADING ===
  const loadAll = useCallback(async () => {
    if (!program || !wallet || !connected) return;
    await Promise.all([loadConfig(), loadUserBalance(), loadAllGames()]);
  }, [program, wallet, connected]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 5000);
    return () => clearInterval(id);
  }, [loadAll]);

  const loadConfig = async () => {
    if (!configPda || !program) return;
    try {
      const data = await program.account.config.fetch(configPda);
      setConfig(data);
      setIsAdmin(data.admin.toBase58() === wallet?.toBase58());
    } catch { }
  };

  const loadUserBalance = async () => {
    if (!userPda || !program) return;
    const info = await connection.getAccountInfo(userPda);
    if (!info) { setUserBalance(null); return; }
    try { setUserBalance(await program.account.userBalance.fetch(userPda)); }
    catch { setUserBalance(null); }
  };

  const loadAllGames = async () => {
    if (!program) return;
    try {
      const games = await program.account.gameState.all();
      const sorted = games.map(g => g.account).sort((a, b) => Number(b.createdAt.sub(a.createdAt)));
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
    } catch (e) { console.error(e); }
  };

  const loadActiveBets = async (gameId: PublicKey) => {
    if (!program) return;
    try {
      const bets = await program.account.bet.all();
      const active = bets
        .filter(b => b.account.gameId.toBase58() === gameId.toBase58() && b.account.active)
        .map(b => b.account);
      setActiveBets(active);
    } catch { }
  };

  const loadMyBets = async (gameId: PublicKey) => {
    if (!program || !wallet) return;
    try {
      const bets = await program.account.bet.all();
      const my = bets
        .filter(b => b.account.user.toBase58() === wallet.toBase58() && b.account.gameId.toBase58() === gameId.toBase58())
        .map(b => b.account);
      setMyBets(my);
    } catch { }
  };

  const startAnimation = (target: number) => {
    setMultiplier(100);
    setIsAnimating(true);
    const int = setInterval(() => {
      setMultiplier(prev => {
        if (prev >= target * 100) {
          clearInterval(int);
          setIsAnimating(false);
          return target * 100;
        }
        return prev + Math.floor(Math.random() * 35);
      });
    }, 80);
  };

  // ==============================================================
  // === ON-CHAIN INSTRUCTIONS (EXISTING + NEW) ===
  // ==============================================================

  const initialize = async () => {
    if (!program || !wallet || !configPda || !vaultPda) return;
    setLoading(true);
    try {
      const tx = await program.methods.initialize(wallet)
        .accounts({ config: configPda, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Config initialized!');
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const createUser = async () => {
    if (!program || !wallet || !userPda) return;
    setLoading(true);
    try {
      const tx = await program.methods.createUser()
        .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'User created!');
      setTimeout(loadUserBalance, 3000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

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
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

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
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

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
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const placeUserBet = async () => {
    if (!program || !wallet || !currentGame || !betAmt || !userPda) return;
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
          signer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Bet placed!');
      setBetAmt('');
      loadActiveBets(currentGame.gameId);
      loadMyBets(currentGame.gameId);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const placeAdminBet = async () => {
    if (!program || !wallet || !currentGame || !betAmt) return;
    const lamports = Math.floor(parseFloat(betAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');

    let targetUser = wallet;
    if (betUser) {
      try { targetUser = new PublicKey(betUser); }
      catch { return showStatus('error', 'Invalid pubkey'); }
    }

    const [userBalancePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_balance'), targetUser.toBytes()], PROGRAM_ID
    );
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), targetUser.toBytes(), currentGame.gameId.toBytes()], PROGRAM_ID
    );

    setLoading(true);
    try {
      const tx = await program.methods.placeBet(new BN(lamports))
        .accounts({
          bet: betPda,
          userBalance: userBalancePda,
          gameState: currentGame.gameId,
          signer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Bet placed!');
      setBetUser(''); setBetAmt('');
      loadActiveBets(currentGame.gameId);
      if (targetUser.toBase58() === wallet.toBase58()) loadMyBets(currentGame.gameId);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const claimPayout = async (bet: any) => {
    if (!program || !wallet || !userPda) return;
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), bet.user.toBytes(), bet.gameId.toBytes()], PROGRAM_ID
    );

    setLoading(true);
    try {
      const tx = await program.methods.claimPayout()
        .accounts({ bet: betPda, userBalance: userPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Payout claimed!');
      loadUserBalance();
      loadMyBets(bet.gameId);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const resolveGame = async () => {
    if (!program || !wallet || !currentGame || !vaultPda) return;
    setLoading(true);
    setIsAnimating(false);
    try {
      const allBets = await program.account.bet.all();
      const gameBets = allBets.filter(b => b.account.gameId.toBase58() === currentGame.gameId.toBase58());

      const remaining: any[] = [];
      for (const bet of gameBets) {
        const betAcc = bet.publicKey;
        const userPda = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.account.user.toBytes()], PROGRAM_ID)[0];
        remaining.push({ pubkey: betAcc, isSigner: false, isWritable: true });
        remaining.push({ pubkey: userPda, isSigner: false, isWritable: true });
      }

      const tx = await program.methods.resolveGame(crashNow)
        .accounts({ gameState: currentGame.gameId, vault: vaultPda, signer: wallet, systemProgram: SystemProgram.programId })
        .remainingAccounts(remaining)
        .transaction();

      await sendTransaction(tx, connection);
      showStatus('success', crashNow ? 'CRASHED!' : 'WINNERS PAID!');

      // AUTO-CREATE NEXT GAME
      setTimeout(async () => {
        const nextMult = 200 + Math.floor(Math.random() * 300);
        const name = `Crash #${Date.now().toString().slice(-4)}`;
        const createdAtSec = Math.floor(Date.now() / 1000);
        const seed = new Uint32Array([createdAtSec]);
        const seedBytes = Buffer.from(seed.buffer);
        const [newGamePda] = PublicKey.findProgramAddressSync([Buffer.from('game'), seedBytes], PROGRAM_ID);

        try {
          const newTx = await program.methods.createGame(new BN(nextMult), name, createdAtSec)
            .accounts({ gameState: newGamePda, signer: wallet, systemProgram: SystemProgram.programId })
            .transaction();
          await sendTransaction(newTx, connection);
          showStatus('success', `New game: ${name}`);
          loadAllGames();
        } catch (e: any) { showStatus('error', 'Auto-game failed'); }
      }, 3000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); setCrashNow(false); }
  };

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
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

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
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  // ------------------- NEW ADMIN FUNCTIONS -------------------

  /** Change the admin address */
  const adminSetNewAdmin = async () => {
    if (!program || !wallet || !configPda || !adminSetAdmin) return;
    let newAdmin: PublicKey;
    try { newAdmin = new PublicKey(adminSetAdmin); }
    catch { return showStatus('error', 'Invalid pubkey'); }

    setLoading(true);
    try {
      const tx = await program.methods.adminSetAdmin(newAdmin)
        .accounts({ config: configPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'New admin set!');
      setAdminSetAdmin('');
      setTimeout(loadConfig, 2000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  /** Update fee (basis points) */
  const adminSetFee = async () => {
    if (!program || !wallet || !configPda || !adminSetFeeBps) return;
    const bps = parseInt(adminSetFeeBps, 10);
    if (isNaN(bps) || bps < 0 || bps > 10_000) return showStatus('error', '0-10,000 bps');

    setLoading(true);
    try {
      const tx = await program.methods.adminSetFeeBps(bps)
        .accounts({ config: configPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', `Fee set to ${bps} bps`);
      setAdminSetFeeBps('');
      setTimeout(loadConfig, 2000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  /** Pause the whole program */
  const adminPauseProgram = async () => {
    if (!program || !wallet || !configPda) return;
    setLoading(true);
    try {
      const tx = await program.methods.adminPause()
        .accounts({ config: configPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Program paused');
      setTimeout(loadConfig, 2000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  /** Resume the program */
  const adminResumeProgram = async () => {
    if (!program || !wallet || !configPda) return;
    setLoading(true);
    try {
      const tx = await program.methods.adminResume()
        .accounts({ config: configPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Program resumed');
      setTimeout(loadConfig, 2000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  // ==============================================================
  // === UI RENDERING ===
  // ==============================================================

  return (
    <>



          {!connected ? (
        <></>
          ) : (
            <>
             
          

                {!userBalance ? (
                  <>
                
                    
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-5xl font-black">
                        {(Number(userBalance.balance.toString()) / LAMPORTS_PER_SOL).toFixed(6)} SOL
                      </p>
                      {userBalance.hasActiveBet && (
                        <p className="text-orange-400 mt-2 flex items-center justify-center gap-2">
                       
                        </p>
                      )}
                    </div>

                   
                 
                  </div>
                )}
          
            </>
          )}
    
    </>
  );
}