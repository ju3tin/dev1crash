//const heliusRpcUrl = 'https://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76';
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@project-serum/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
useWallet,
useAnchorWallet,
WalletProvider,
ConnectionProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import idl from '../public/idl.json'; 
import '@solana/wallet-adapter-react-ui/styles.css';

// Program ID
const programId = new PublicKey('6NT24hJjnqwKw6JNDkrV2a7nPvB8GdB61Csz9mEB7DnZ');

// Helius RPC URL (replace with your API key)
const heliusRpcUrl = 'https://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76';
const network = WalletAdapterNetwork.Devnet;
const endpoint = heliusRpcUrl;
const wsEndpoint = 'wss://devnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76';

// PDAs (derived from IDL expectations)
const getVaultPda = () => PublicKey.findProgramAddressSync([Buffer.from('vault')], programId)[0];
const getUserBalancePda = (user: PublicKey) =>
PublicKey.findProgramAddressSync(
    [user.toBuffer(), Buffer.from('balance')],
    programId
)[0];

const App: React.FC = () => {
const { publicKey, connected } = useWallet();
const anchorWallet = useAnchorWallet();
const [amount, setAmount] = useState<string>('');
const [status, setStatus] = useState<string>('');
const [error, setError] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);

// Initialize Anchor provider with Helius RPC
const provider = useMemo(() => {
    if (!publicKey || !anchorWallet) return null;
    const connection = new Connection(endpoint, { wsEndpoint, commitment: 'confirmed' });
    return new AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' });
}, [publicKey, anchorWallet]);

// Initialize program
const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as Idl, programId, provider);
}, [provider]);

// No separate user balance initializer in IDL; deposit will handle balance updates

// Handle deposit SOL
const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey || !anchorWallet || !provider) {
    setError('Wallet not connected or program not initialized');
    return;
    }

    try {
    setIsLoading(true);
    setError('');

    const userBalancePda = getUserBalancePda(publicKey);
    const vaultPda = getVaultPda();

    const amountLamports = new BN(Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL));
    const tx = await program.methods
        .deposit(amountLamports)
        .accounts({
        user: publicKey,
        vault: vaultPda,
        userBalance: userBalancePda,
        systemProgram: SystemProgram.programId,
        })
        .transaction();

    tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    tx.feePayer = publicKey;
    const signedTx = await anchorWallet.signTransaction(tx);
    const txId = await provider.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        maxRetries: 0,
    });
    await provider.connection.confirmTransaction(txId);
    setStatus(`Deposit successful: ${txId}`);
    setAmount('');
    } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    setError(`Deposit failed: ${message}`);
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
