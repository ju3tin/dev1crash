'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function GamePage() {
  const program = useProgram();
  const { publicKey: wallet } = useWallet(); // Correct way
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState('2.0');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!program || !wallet) return;
    loadUser();
  }, [program, wallet]);

  const loadUser = async () => {
    if (!program || !wallet) return;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), wallet.toBytes()],
      program.programId
    );
    try {
      const data = await program.account.userAccount.fetch(userPda);
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  const initializeGame = async () => {
    if (!program || !wallet) return;
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], program.programId);

    try {
      await program.methods.initialize(wallet)
        .accounts({
          config: configPda,
          vault: vaultPda,
          payer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus('Game initialized!');
      loadUser();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  const createUser = async () => {
    if (!program || !wallet) return;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), wallet.toBytes()],
      program.programId
    );
    try {
      await program.methods.createUser()
        .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('User created!');
      loadUser();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  const deposit = async () => {
    if (!program || !wallet) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    if (isNaN(lamports) || lamports <= 0) {
      setStatus('Invalid amount');
      return;
    }

    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBytes()], program.programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], program.programId);

    try {
      await program.methods.deposit(new BN(lamports))
        .accounts({ userWallet: wallet, user: userPda, vault: vaultPda, systemProgram: SystemProgram.programId })
        .rpc();
      setStatus('Deposited!');
      setAmount('');
      loadUser();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  const placeBet = async () => {
    if (!program || !wallet) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    const target = parseFloat(multiplier);
    if (isNaN(lamports) || lamports <= 0 || isNaN(target) || target < 1.01) {
      setStatus('Invalid bet');
      return;
    }

    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBytes()], program.programId);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);

    try {
      await program.methods.requestBet(new BN(lamports), target)
        .accounts({ user: userPda, config: configPda, userWallet: wallet })
        .rpc();
      setStatus('Bet placed!');
      setAmount('');
      setMultiplier('2.0');
      loadUser();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-4xl font-bold text-center mb-8">PLAY CRASH</h1>

        {!wallet ? (
          <p className="text-center text-yellow-300">Connect wallet to play</p>
        ) : !user ? (
          <div className="space-y-4">
            <button
              onClick={initializeGame}
              className="w-full p-4 bg-purple-700 rounded-lg text-xl font-bold hover:bg-purple-800 transition"
            >
              INITIALIZE GAME (Run Once)
            </button>
            <button
              onClick={createUser}
              className="w-full p-4 bg-green-600 rounded-lg text-xl font-bold hover:bg-green-700 transition"
            >
              Create User Account
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl text-center mb-6 border border-white/20">
              <p className="text-2xl font-mono">Balance: {(user.balance / 1e9).toFixed(4)} SOL</p>
              <p className="text-lg mt-2 text-yellow-300">
                Pending: {user.pending.amount > 0
                  ? `${(user.pending.amount / 1e9).toFixed(4)} @ ${user.pending.targetMultiplier}x`
                  : 'None'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Amount (SOL)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-white/10 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={deposit}
                  className="w-full p-3 bg-blue-600 rounded font-bold hover:bg-blue-700 transition"
                >
                  Deposit
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Multiplier (e.g. 2.0)"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-full p-3 bg-white/10 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={placeBet}
                  className="w-full p-3 bg-red-600 rounded font-bold hover:bg-red-700 transition"
                >
                  Place Bet
                </button>
              </div>
            </div>

            {status && (
              <p className={`text-center mt-4 font-medium ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {status}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}