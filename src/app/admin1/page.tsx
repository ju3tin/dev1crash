'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor1';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const program = useProgram();
  const { publicKey: wallet, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState('');
  const [crashed, setCrashed] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<any>(null);
  const [userPda, setUserPda] = useState<PublicKey | null>(null);

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
    if (!program || !gamePda || !wallet) return;
    try {
      const data = await program.account.gameState.fetch(gamePda);
      if (data.active) {
        setGame(data);
        const [betPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('bet'), wallet.toBytes(), gamePda.toBytes()],
          program.programId
        );
        const bet = await program.account.bet.fetch(betPda);
        const [up] = PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId);
        setUserPda(up);
      } else {
        setGame(null);
      }
    } catch {
      setGame(null);
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

  const resolveGame = async () => {
    if (!program || !wallet || !game || !configPda || !userPda) return;
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), wallet.toBytes(), gamePda!.toBytes()],
      program.programId
    );
    setLoading(true);
    try {
      const sig = await program.methods.resolveGame(crashed)
        .accounts({
          gameState: gamePda!,
          bet: betPda,
          userBalance: userPda,
          config: configPda,
          signer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(crashed ? 'Crashed!' : 'Players won!');
      loadActiveGame();
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

        <div className="space-y-4">
          <input placeholder="New Admin Pubkey" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} className="w-full p-3 bg-white/10 rounded" />
          <button onClick={updateAdmin} disabled={loading} className="w-full p-3 bg-orange-600 rounded">
            {loading ? 'Updating...' : 'Update Admin'}
          </button>
        </div>

        {game && (
          <div className="mt-6 p-4 bg-white/10 rounded">
            <p>Active: {game.gameName} @ {(game.multiplier / 100).toFixed(2)}x</p>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={crashed} onChange={e => setCrashed(e.target.checked)} />
              <span>Crash Game?</span>
            </label>
            <button onClick={resolveGame} disabled={loading} className="w-full mt-3 p-3 bg-red-600 rounded font-bold">
              {loading ? 'Resolving...' : 'RESOLVE GAME'}
            </button>
          </div>
        )}

        {status && <p className={`mt-4 text-center ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
      </div>
    </>
  );
}