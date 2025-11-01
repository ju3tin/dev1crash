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
  const [userBalance, setUserBalance] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // PDAs — CORRECT
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], program.programId)[0] : null;

  useEffect(() => {
    if (!program || !wallet || !connected || !userPda) return;
    checkAndLoadUserBalance();
  }, [program, wallet, connected, userPda]);

  const checkAndLoadUserBalance = async () => {
    if (!program || !userPda) return;

    // Check if account exists
    const accountInfo = await program.provider.connection.getAccountInfo(userPda);
    if (!accountInfo) {
      setUserBalance(null);
      return;
    }

    // Check if account is owned by the program
    if (accountInfo.owner.toBase58() !== program.programId.toBase58()) {
      setUserBalance(null);
      return;
    }

    // Check if account has minimum data (discriminator + at least some fields)
    // Anchor accounts need at least 8 bytes for discriminator
    if (accountInfo.data.length < 8) {
      setUserBalance(null);
      return;
    }

    try {
      const data = await program.account.userBalance.fetch(userPda);
      setUserBalance(data);
    } catch (err: any) {
      console.error('Deserialize failed:', err);
      // If account exists but can't be deserialized, treat as non-existent
      // This handles corrupted or uninitialized accounts
      if (err.code === 3003 || err.message?.includes('AccountDidNotDeserialize') || err.message?.includes('deserialize')) {
        setUserBalance(null);
        setStatus('Account exists but needs initialization. Please deposit to initialize.');
      } else {
        setUserBalance(null);
      }
    }
  };

  const initialize = async () => {
    if (!program || !wallet || !configPda) return;
    setLoading(true);
    try {
      const sig = await program.methods
        .initialize(wallet)
        .accounts({ config: configPda, signer: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Initialized! Tx: ${sig.slice(0, 8)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    if (!program || !wallet || !userPda || !amount) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    if (lamports < 1000) {
      setStatus('Min 0.000001 SOL');
      return;
    }
    setLoading(true);
    try {
      // Check if account exists and can be deserialized before deposit
      const accountInfo = await program.provider.connection.getAccountInfo(userPda);
      let accountCorrupted = false;
      
      if (accountInfo) {
        try {
          // Try to fetch to see if it's valid
          await program.account.userBalance.fetch(userPda);
        } catch (fetchErr: any) {
          // Account exists but can't be deserialized
          if (fetchErr.code === 3003 || fetchErr.message?.includes('AccountDidNotDeserialize')) {
            accountCorrupted = true;
            console.warn('Account exists but invalid, attempting deposit...');
            // Note: init_if_needed won't help if account exists but is corrupted
            // Anchor validates account structure before instruction execution
          }
        }
      }

      if (accountCorrupted) {
        setStatus('Error: Account exists but cannot be read. The account may need to be closed and recreated. Contact admin for assistance.');
        setLoading(false);
        return;
      }

      const sig = await program.methods
        .deposit(new BN(lamports))
        .accounts({ userBalance: userPda, user: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus(`Deposited! Tx: ${sig.slice(0, 8)}...`);
      setAmount('');
      setTimeout(checkAndLoadUserBalance, 3000); // Wait for account creation
    } catch (e: any) {
      console.error('Deposit error:', e);
      // Check for deserialization error
      const errorCode = e.error?.code || e.code;
      const errorMessage = e.message || e.toString();
      
      if (errorCode === 3003 || errorMessage?.includes('AccountDidNotDeserialize') || errorMessage?.includes('Failed to deserialize')) {
        setStatus('Error: Account exists but is corrupted. The account needs to be closed and recreated. Please contact an admin or use a different wallet.');
      } else if (errorMessage?.includes('0x1')) {
        // Insufficient funds error
        setStatus('Error: Insufficient SOL balance in wallet.');
      } else {
        setStatus(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-4xl font-bold text-center mb-8">CRASH GAME</h1>

        {!connected ? (
          <p className="text-center text-yellow-300">Connect wallet</p>
        ) : !userBalance ? (
          <div className="space-y-4">
            <button
              onClick={initialize}
              disabled={loading}
              className="w-full p-4 bg-purple-700 rounded-lg font-bold hover:bg-purple-800 transition"
            >
              {loading ? 'Initializing...' : 'INITIALIZE GAME'}
            </button>

            <input
              type="number"
              placeholder="Amount (SOL)"
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
          <div className="bg-white/10 p-6 rounded-xl text-center">
            <p className="text-2xl font-bold">Balance: {(userBalance.balance / 1e9).toFixed(6)} SOL</p>
            {userBalance.hasActiveBet && (
              <p className="text-yellow-300 mt-2">Bet Active: {(userBalance.activeBetAmount / 1e9).toFixed(6)} SOL</p>
            )}
            <p className="text-green-400 mt-4">Ready to play! Ask admin to create a game.</p>
          </div>
        )}

        {status && (
          <p className={`text-center mt-6 text-lg ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {status}
          </p>
        )}
      </div>
    </>
  );
}