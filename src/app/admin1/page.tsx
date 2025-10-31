'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor1';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const program = useProgram();
  const { publicKey: wallet, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState('');
  const [multiplier, setMultiplier] = useState('2.0');
  const [gameName, setGameName] = useState('Crash #1');
  const [betAmount, setBetAmount] = useState('');
  const [betUser, setBetUser] = useState('');
  const [crashed, setCrashed] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<any>(null);

  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const gamePda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('game_state'), wallet.toBytes()], program.programId)[0] : null;

  useEffect(() => {
    if (!program || !wallet || !connected) return;
    checkAdmin();
    loadActiveGame();
  }, [program, wallet, connected]);

  const checkAdmin = async () => {
    if (!program || !configPda) return;
    try {
      const config = await program.account.config.fetch(configPda);
      setIsAdmin(config.admin.toBase58() === wallet?.toBase58());
    } catch {}
  };

  const loadActiveGame = async () => {
    if (!program || !gamePda) return;
    try {
      const data = await program.account.gameState.fetch(gamePda);
      if (data.active) setGame(data);
      else setGame(null);
    } catch {
      setGame(null);
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
    if (!program || !wallet || !gamePda || !configPda || !betUser || !betAmount) return;
    const lamports = Math.floor(parseFloat(betAmount) * 1e9);
    if (lamports < 1000) {
      setStatus('Min 0.000001 SOL');
      return;
    }
    const userPubkey = new PublicKey(betUser);
    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), userPubkey.toBytes()], program.programId);
    const [betPda] = PublicKey.findProgramAddressSync([Buffer.from('bet'), userPubkey.toBytes(), gamePda.toBytes()], program.programId);
    setLoading(true);
    try {
      const sig = await program.methods.placeBet(userPubkey, new BN(lamports))
        .accounts({ bet: betPda, userBalance: userPda, gameState: gamePda, config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Bet placed! Tx: ${sig.slice(0, 8)}...`);
      setBetAmount('');
      setBetUser('');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveGame = async () => {
    if (!program || !wallet || !game || !configPda || !gamePda) return;
    // Find all bets for this game
    const bets = await program.account.bet.all();
    const gameBets = bets.filter(b => b.account.gameId.toBase58() === gamePda.toBase58() && b.account.active);
    setLoading(true);
    try {
      for (const bet of gameBets) {
        const userPda = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), bet.account.user.toBytes()], program.programId)[0];
        await program.methods.resolveGame(crashed)
          .accounts({
            gameState: gamePda,
            bet: bet.publicKey,
            userBalance: userPda,
            config: configPda,
            signer: wallet,
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

  const updateAdmin = async () => {
    if (!program || !wallet || !configPda || !newAdmin) return;
    setLoading(true);
    try {
      const sig = await program.methods.updateAdmin(new PublicKey(newAdmin))
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Admin updated! Tx: ${sig.slice(0, 8)}...`);
      checkAdmin();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) return <><Navbar /><div className="pt-24 text-center">Connect wallet</div></>;
  if (!isAdmin) return <><Navbar /><div className="pt-24 text-center text-red-400">Unauthorized</div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24 bg-red-900/50 rounded-xl border border-red-500">
        <h2 className="text-3xl font-bold mb-6 text-red-300">ADMIN PANEL</h2>

        {!game ? (
          <div className="space-y-4">
            <input placeholder="Multiplier (e.g. 2.0)" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
            <input placeholder="Game Name" value={gameName} onChange={e => setGameName(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
            <button onClick={createGame} disabled={loading} className="w-full p-4 bg-purple-600 rounded font-bold">
              {loading ? 'Creating...' : 'CREATE GAME'}
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white/10 rounded mb-4">
              <p>Active: {game.gameName} @ {(game.multiplier.toNumber() / 100).toFixed(2)}x</p>
              <p>Bets: {game.totalBets.toNumber()} | Volume: {(game.totalVolume.toNumber() / 1e9).toFixed(4)} SOL</p>
            </div>

            <div className="space-y-4 mb-4">
              <input placeholder="User Pubkey" value={betUser} onChange={e => setBetUser(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
              <input placeholder="Bet Amount (SOL)" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
              <button onClick={placeBet} disabled={loading} className="w-full p-3 bg-green-600 rounded">
                {loading ? 'Placing...' : 'PLACE BET FOR USER'}
              </button>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={crashed} onChange={e => setCrashed(e.target.checked)} />
              <span>Crash Game?</span>
            </label>
            <button onClick={resolveGame} disabled={loading} className="w-full mt-3 p-3 bg-red-600 rounded font-bold">
              {loading ? 'Resolving...' : 'RESOLVE GAME'}
            </button>
          </>
        )}

        <div className="mt-6 space-y-4">
          <input placeholder="New Admin Pubkey" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
          <button onClick={updateAdmin} disabled={loading} className="w-full p-3 bg-orange-600 rounded">
            {loading ? 'Updating...' : 'Update Admin'}
          </button>
        </div>

        {status && <p className={`mt-4 text-center ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
      </div>
    </>
  );
}