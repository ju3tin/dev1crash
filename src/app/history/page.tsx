'use client';

import { useEffect, useState } from 'react';
import { useProgram } from '@/lib/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Navbar from '@/components/Navbar';
import HistoryTable from './components/HistoryTable';

export default function HistoryPage() {
  const program = useProgram();
  const { connected } = useWallet();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!program || !connected) {
      setLoading(false);
      return;
    }
    loadHistory();
  }, [program, connected]);

  const loadHistory = async () => {
    if (!program) return;
    setLoading(true);
    setError('');

    try {
      const [roundPda] = PublicKey.findProgramAddressSync([Buffer.from('round')], program.programId);
      const roundData = await program.account.round.fetch(roundPda);

      // Build history from round ID
      const history = [];
      for (let i = 1; i <= Number(roundData.id); i++) {
        // In real app: fetch from events or off-chain DB
        // Here: simulate with crash point (you can enhance later)
        const crash = (1 + Math.random() * 5).toFixed(2); // Mock
        history.push({
          id: i,
          crashPoint: crash,
          timestamp: new Date(Date.now() - (roundData.id - i) * 60000).toLocaleTimeString(),
        });
      }
      setRounds(history.reverse());
    } catch (e: any) {
      setError('No rounds yet or failed to load');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">ROUND HISTORY</h1>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <p className="text-red-400 text-center mb-6">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : rounds.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No rounds played yet</p>
        ) : (
          <HistoryTable rounds={rounds} />
        )}
      </div>
    </>
  );
}
