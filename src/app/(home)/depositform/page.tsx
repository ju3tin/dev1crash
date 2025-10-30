"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@solana/wallet-adapter-base';
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

// Program ID
const programId = new PublicKey('6NT24hJjnqwKw6JNDkrV2a7nPvB8GdB61Csz9mEB7DnZ');

// Helius RPC URL (replace with your API key)
const heliusRpcUrl = 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';
const network = WalletAdapterNetwork.Devnet;
const endpoint = heliusRpcUrl;
const wsEndpoint = 'wss://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';

// PDAs
const getGamePda = () => PublicKey.findProgramAddressSync([Buffer.from('config')], programId)[0];
const getSolVaultPda = () => PublicKey.findProgramAddressSync([Buffer.from('sol_vault'), getGamePda().toBuffer()], programId)[0];
const getUserAccountPda = (user: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('user'), user.toBuffer(), getGamePda().toBuffer()],
    programId
  )[0];

// Instruction discriminators (derived from Anchor program, e.g., via `solana program dump` or manual inspection)
const initializeUserDiscriminator = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // Placeholder, replace with actual
const depositSolDiscriminator = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // Placeholder, replace with actual

const App: React.FC = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize connection
  const connection = useMemo(() => new Connection(endpoint, { wsEndpoint, commitment: 'confirmed' }), []);

  // Check if user account exists
  const checkUserAccount = async (userAccountPda: PublicKey) => {
    const accountInfo = await connection.getAccountInfo(userAccountPda);
    return !!accountInfo;
  };

  // Initialize user
  const initializeUser = async () => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      const userAccountPda = getUserAccountPda(publicKey);
      const accountExists = await checkUserAccount(userAccountPda);

      if (!accountExists) {
        const tx = new Transaction();
        tx.add(
          new TransactionInstruction({
            keys: [
              { pubkey: userAccountPda, isSigner: false, isWritable: true },
              { pubkey: publicKey, isSigner: true, isWritable: true },
              { pubkey: getGamePda(), isSigner: false, isWritable: false },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId,
            data: initializeUserDiscriminator, // No additional data for initialize_user
          })
        );

        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = publicKey;
        const signedTx = await signTransaction(tx);
        const txId = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 0,
        });
        await connection.confirmTransaction(txId);
        setStatus(`User account initialized: ${txId}`);
      } else {
        setStatus('User account already initialized');
      }
    } catch (err) {
      setError(`Error initializing user: ${`err.message`}`);
      setIsLoading(false);
    }
  };

  // Handle deposit SOL
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Ensure user account is initialized
      const userAccountPda = getUserAccountPda(publicKey);
      const accountExists = await checkUserAccount(userAccountPda);
      if (!accountExists) {
        await initializeUser();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const amountLamports = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
      const data = Buffer.concat([
        depositSolDiscriminator,
        Buffer.from(new Uint8Array(new BigUint64Array([amountLamports]).buffer)), // Encode u64 amount
      ]);

      const tx = new Transaction();
      tx.add(
        new TransactionInstruction({
          keys: [
            { pubkey: userAccountPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: getGamePda(), isSigner: false, isWritable: false },
            { pubkey: getSolVaultPda(), isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId,
          data,
        })
      );

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;
      const signedTx = await signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        maxRetries: 0,
      });
      await connection.confirmTransaction(txId);
      setStatus(`Deposit successful: ${txId}`);
      setAmount('');
    } catch (err) {
      setError(`Deposit failed: ${`err.message`}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Solana Crash Game Deposit</h1>
        <WalletMultiButton className="w-full mb-4" />
        {connected ? (
          <div>
            <p className="text-sm mb-2">Connected: {publicKey?.toString()}</p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter SOL amount"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !amount}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Processing...' : 'Deposit SOL'}
              </button>
            </form>
            {status && <p className="mt-4 text-sm text-green-600">{status}</p>}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-600">Please connect your wallet to deposit SOL.</p>
        )}
      </div>
    </div>
  );
};

const AppWithProviders: React.FC = () => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default AppWithProviders;