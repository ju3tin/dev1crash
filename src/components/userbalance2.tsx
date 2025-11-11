// components/UserBalance.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProgram } from '@/lib/anchor7';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Zap } from 'lucide-react';

const PROGRAM_ID = new PublicKey('C3aRucgPgxHHD5nrT4busuTTnVmF55gqJwAccQwr8Qi4');

interface Props {
  /** optional className to override the outer wrapper */
  className?: string;
}

/** --------------------------------------------------------------
 *  USER BALANCE COMPONENT
 *  -------------------------------------------------------------- */
export default function UserBalance({ className = '' }: Props) {
  const program = useProgram();
  const { connection } = useConnection();
  const { publicKey: wallet, connected } = useWallet();

  const [balance, setBalance] = useState<bigint | null>(null);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [loading, setLoading] = useState(false);

  // PDA for the user's on-chain balance account
  const userPda = wallet
    ? PublicKey.findProgramAddressSync(
        [Buffer.from('user_balance'), wallet.toBytes()],
        PROGRAM_ID
      )[0]
    : null;

  const fetchBalance = useCallback(async () => {
    if (!program || !wallet || !userPda || !connected) {
      setBalance(null);
      setHasActiveBet(false);
      return;
    }

    setLoading(true);
    try {
      const info = await connection.getAccountInfo(userPda);
      if (!info) {
        setBalance(null);
        setHasActiveBet(false);
        return;
      }

      const data = await program.account.userBalance.fetch(userPda);
      setBalance(BigInt(data.balance.toString()));
      setHasActiveBet(!!data.hasActiveBet);
    } catch {
      setBalance(null);
      setHasActiveBet(false);
    } finally {
      setLoading(false);
    }
  }, [program, wallet, userPda, connection, connected]);

  // initial load + periodic refresh
  useEffect(() => {
    fetchBalance();
    const id = setInterval(fetchBalance, 5_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------
  if (!connected) {
    return null; // hide when wallet not connected
  }

  const sol = balance !== null ? Number(balance) / LAMPORTS_PER_SOL : 0;

  return (
    <div
      className={`bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl ${className}`}
    >
      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
        <span className="text-green-400">Wallet Balance</span>
      </h3>

      {loading ? (
        <div className="animate-pulse text-3xl font-black">…</div>
      ) : balance === null ? (
        <p className="text-gray-400">No balance account</p>
      ) : (
        <>
          <p className="text-4xl font-black">
            {sol.toFixed(6)} <span className="text-sm">SOL</span>
          </p>

          {hasActiveBet && (
            <p className="mt-2 text-orange-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              BET ACTIVE
            </p>
          )}
        </>
      )}
    </div>
  );
}