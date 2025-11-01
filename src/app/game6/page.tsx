'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor2';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function GamePage() {
  const program = useProgram();
  const { publicKey: wallet, connected, sendTransaction } = useWallet();
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

  // PDAs
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId)[0] : null;
  const gamePda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('game_state'), wallet.toBytes()], program.programId)[0] : null;

  useEffect(() => {
    if (!program || !wallet || !connected) return;
    checkAdmin();
    checkUserBalance();
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

  const checkUserBalance = async () => {
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
    if (!program || !wallet || !configPda) return;
    setLoading(true);
    try {
      const tx = await program.methods
        .initialize(wallet)
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();

      const { blockhash } = await program.provider.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet;

      const sig = await sendTransaction(tx, program.provider.connection);
      await program.provider.connection.confirmTransaction(sig);
      setStatus(`Initialized! Tx: ${sig.slice(0, 8)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!program || !wallet || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) {
      setStatus('Min 0.000001 SOL');
      return;
    }
    setLoading(true);
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(userPda);
      const isNew = !accountInfo;
      const space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 8;
      const rent = isNew ? await program.provider.connection.getMinimumBalanceForRentExemption(space) : 0;

      const tx = await program.methods
        .deposit(new BN(lamports))
        .accounts({ userBalance: userPda, user: wallet, systemProgram: SystemProgram.programId })
        .preInstructions(
          isNew
            ? [SystemProgram.createAccount({ fromPubkey: wallet, newAccountPubkey: userPda, space, lamports: rent, programId: program.programId })]
            : []
        )
        .transaction();

      const { blockhash } = await program.provider.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet;

      const sig = await sendTransaction(tx, program.provider.connection);
      await program.provider.connection.confirmTransaction(sig);
      setStatus(`Deposited! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      setTimeout(checkUserBalance, 3000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!program || !wallet || !configPda || !gamePda || !multiplier) return;
    const mult = Math.floor(parseFloat(multiplier) * 100);
    if (mult < 100 || mult > 10000) {
      setStatus('1.0x - 100x');
      return;
    }
    setLoading(true);
    try {
      const tx = await program.methods
        .createGame(new BN(mult), gameName)
        .accounts({ gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();

      const { blockhash } = await program.provider.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet;

      const sig = await sendTransaction(tx, program.provider.connection);
      await program.provider.connection.confirmTransaction(sig);
      setStatus(`Game created! Tx: ${sig.slice(0, 8)}...`);
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!program || !wallet || !gamePda || !configPda || !betUser || !betAmount) return;
    const lamports = Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL);
    if (lamports < 1000) {
      setStatus('Min 0.000001 SOL');
      return;
    }
    const userPubkey = new PublicKey(betUser);
    const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), userPubkey.toBytes()], program.programId);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), userPubkey.toBytes(), gamePda.toBytes()], program.programId);

    setLoading(true);
    try {
      const tx = await program.methods
        .placeBet(userPubkey, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userBalancePda, gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .transaction();

      const { blockhash } = await program.provider.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet;

      const sig = await sendTransaction(tx, program.provider.connection);
      await program.provider.connection.confirmTransaction(sig);
      setStatus(`Bet placed! Tx: ${sig.slice(0, 8)}...`);
      setBetUser('');
      setBetAmount('');
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveGame = async () => {
    if (!program || !wallet || !gameState || !configPda || !gamePda) return;
    const bets = await program.account.bet.all();
    const gameBets = bets.filter(b => b.account.gameId.toBase58() === gamePda.toBase58() && b.account.active);
    setLoading(true);
    try {
      for (const bet of gameBets) {
        const [userBalancePda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.account.user.toBytes()], program.programId);
        const tx = await program.methods
          .resolveGame(crashed)
          .accounts({
            gameState: gamePda,
            bet: bet.publicKey,
            userBalance: userBalancePda,
            config: configPda,
            signer: wallet,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        const { blockhash } = await program.provider.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet;

        const sig = await sendTransaction(tx, program.provider.connection);
        await program.provider.connection.confirmTransaction(sig);
      }
      setStatus(crashed ? 'Crashed!' : 'Players won!');
      loadActiveGame();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-24 space-y-8">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          CRASH GAME
        </h1>

        {!connected ? (
          <p className="text-center text-yellow-300 text-xl">Connect wallet to play</p>
        ) : (
          <>
            {/* USER SECTION */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4">YOUR BALANCE</h2>
              {!userBalance ? (
                <div className="space-y-4">
                  <button
                    onClick={initialize}
                    disabled={loading}
                    className="w-full p-4 bg-purple-700 rounded-lg font-bold hover:bg-purple-800 transition"
                  >
                    {loading ? 'Initializing...' : 'INITIALIZE'}
                  </button>
                  <input
                    type="number"
                    placeholder="Deposit Amount (SOL)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-white/10 rounded text-white placeholder-gray-400"
                    step="0.000001"
                    min="0.000001"
                  />
                  <button
                    onClick={deposit}
                    disabled={loading || !amount}
                    className="w-full p-4 bg-green-600 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Depositing...' : 'DEPOSIT'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl font-bold">{(userBalance.balance.toNumber() / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  {userBalance.hasActiveBet && (
                    <p className="text-yellow-300 mt-2">Bet Active: {(userBalance.activeBetAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  )}
                </div>
              )}
            </div>

            {/* GAME STATUS */}
            {gameState && (
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/50 text-center">
                <p className="text-2xl font-bold">{gameState.gameName}</p>
                <p className="text-4xl font-bold text-green-400 mt-2">{(gameState.multiplier.toNumber() / 100).toFixed(2)}x</p>
                <p className="text-sm mt-2">Bets: {gameState.totalBets.toNumber()} | Volume: {(gameState.totalVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
              </div>
            )}

            {/* ADMIN PANEL */}
            {isAdmin && (
              <div className="bg-red-900/50 backdrop-blur rounded-2xl p-6 border border-red-500/50">
                <h2 className="text-2xl font-bold text-red-300 mb-4">ADMIN CONTROLS</h2>

                {!gameState ? (
                  <div className="space-y-4">
                    <input
                      placeholder="Multiplier (e.g. 2.0)"
                      value={multiplier}
                      onChange={(e) => setMultiplier(e.target.value)}
                      className="w-full p-3 bg-white/10 rounded"
                    />
                    <input
                      placeholder="Game Name"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="w-full p-3 bg-white/10 rounded"
                    />
                    <button
                      onClick={createGame}
                      disabled={loading}
                      className="w-full p-4 bg-purple-600 rounded-lg font-bold hover:bg-purple-700"
                    >
                      {loading ? 'Creating...' : 'CREATE GAME'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <input
                        placeholder="User Pubkey"
                        value={betUser}
                        onChange={(e) => setBetUser(e.target.value)}
                        className="w-full p-3 bg-white/10 rounded"
                      />
                      <input
                        placeholder="Bet Amount (SOL)"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="w-full p-3 bg-white/10 rounded"
                      />
                      <button
                        onClick={placeBet}
                        disabled={loading}
                        className="w-full p-3 bg-green-600 rounded font-bold hover:bg-green-700"
                      >
                        {loading ? 'Placing...' : 'PLACE BET'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <input type="checkbox" checked={crashed} onChange={(e) => setCrashed(e.target.checked)} />
                      <span className="text-white">Crash Game?</span>
                    </div>

                    <button
                      onClick={resolveGame}
                      disabled={loading}
                      className="w-full p-4 bg-red-600 rounded-lg font-bold hover:bg-red-700"
                    >
                      {loading ? 'Resolving...' : 'RESOLVE GAME'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* STATUS */}
            {status && (
              <p className={`text-center text-lg p-4 rounded-lg ${status.includes('Error') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                {status}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}