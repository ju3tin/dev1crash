'use client';

import { useState, useEffect } from 'react';
import { useProgram } from '@/lib/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar';

export default function GamePage() {
  const program = useProgram();
  const wallet = program?.provider.wallet.publicKey;
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState('2.0');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!wallet || !program) return;
    loadUser();
  }, [wallet, program]);

  const loadUser = async () => {
    if (!program) return;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), wallet!.toBytes()],
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
    if (!program) return;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), wallet!.toBytes()],
      program.programId
    );
    await program.methods.createUser()
      .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
      .rpc();
    setStatus('User created!');
    loadUser();
  };

  const deposit = async () => {
    if (!program) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet!.toBytes()], program.programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], program.programId);

    await program.methods.deposit(new BN(lamports))
      .accounts({ userWallet: wallet, user: userPda, vault: vaultPda, systemProgram: SystemProgram.programId })
      .rpc();
    setStatus('Deposited!');
    loadUser();
  };

  const placeBet = async () => {
    if (!program) return;
    const lamports = Math.floor(parseFloat(amount) * 1e9);
    const [userPda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet!.toBytes()], program.programId);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);

    await program.methods.requestBet(new BN(lamports), parseFloat(multiplier))
      .accounts({ user: userPda, config: configPda, userWallet: wallet })
      .rpc();
    setStatus('Bet placed!');
    loadUser();
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-4xl font-bold text-center mb-8">PLAY CRASH</h1>

        {!wallet ? (
          <p className="text-center">Connect wallet to play</p>
        ) : !user ? (
          <div className="space-y-4">
            <button onClick={initializeGame} className="w-full p-4 bg-purple-700 rounded-lg text-xl font-bold">
              INITIALIZE GAME (Run Once)
            </button>
            <button onClick={createUser} className="w-full p-4 bg-green-600 rounded-lg text-xl">
              Create User Account
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/10 p-6 rounded-xl text-center mb-6">
              <p className="text-2xl">Balance: {(user.balance / 1e9).toFixed(4)} SOL</p>
              <p className="text-lg mt-2">
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
                  className="w-full p-3 bg-white/10 rounded text-white"
                />
                <button onClick={deposit} className="w-full p-3 bg-blue-600 rounded font-bold">
                  Deposit
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Multiplier"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-full p-3 bg-white/10 rounded text-white"
                />
                <button onClick={placeBet} className="w-full p-3 bg-red-600 rounded font-bold">
                  Place Bet
                </button>
              </div>
            </div>

            {status && <p className="text-green-400 text-center mt-4">{status}</p>}
          </>
        )}
      </div>
    </>
  );
}