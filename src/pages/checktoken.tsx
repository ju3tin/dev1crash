import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount, getMint } from '@solana/spl-token';
import styles from '@/styles/PageFooter.module.css';

require('@solana/wallet-adapter-react-ui/styles.css');

const MINT_ADDRESS = 'YOUR_MINT_ADDRESS'; // e.g., 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' (USDC)
const MINT_AUTHORITY_ADDRESS = 'YOUR_MINT_AUTHORITY_ADDRESS'; // e.g., the account that minted the token

export default function CheckToken() {
  const { publicKey, connected } = useWallet();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkToken = useCallback(async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      setHasToken(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
      const mintPublicKey = new PublicKey(MINT_ADDRESS);
      const walletPublicKey = new PublicKey(publicKey);

      // Verify mint authority
      const mintInfo = await getMint(connection, mintPublicKey);
      const isCorrectMintAuthority = mintInfo.mintAuthority?.equals(new PublicKey(MINT_AUTHORITY_ADDRESS));

      if (!isCorrectMintAuthority) {
        setError('Token mint authority does not match the specified account');
        setHasToken(false);
        setLoading(false);
        return;
      }

      // Derive the Associated Token Account (ATA)
      const ata = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey);

      // Check if the ATA exists and has a balance
      const accountInfo = await getAccount(connection, ata).catch(() => null);
      if (accountInfo && accountInfo.amount > 0) {
        setHasToken(true);
      } else {
        setHasToken(false);
      }
    } catch (err: any) {
      setError(`Error checking token: ${err.message}`);
      setHasToken(false);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected) {
      checkToken();
    } else {
      setHasToken(null);
      setError(null);
    }
  }, [connected, checkToken]);

  // Conditional logic for reprogramming
  if (hasToken === true) {
    // Token found, allow specific actions
    return (
      <div className={styles.container}>
        <WalletMultiButton />
        <h1 className={styles.title}>Token Check</h1>
        <p className={styles.message}>
          You have the token minted by {MINT_AUTHORITY_ADDRESS} in your wallet!
        </p>
        <button
          className={styles.actionButton}
          onClick={() => alert('Proceed with token-specific action (e.g., access feature)')}
        >
          Perform Token Action
        </button>
      </div>
    );
  } else if (hasToken === false) {
    // Token not found, prompt user to acquire it
    return (
      <div className={styles.container}>
        <WalletMultiButton />
        <h1 className={styles.title}>Token Check</h1>
        <p className={styles.message}>
          You do not have the token minted by {MINT_AUTHORITY_ADDRESS}.
        </p>
        <button
          className={styles.actionButton}
          onClick={() => window.location.href = 'https://example.com/get-token'}
        >
          Get the Token
        </button>
      </div>
    );
  } else if (error) {
    return (
      <div className={styles.container}>
        <WalletMultiButton />
        <h1 className={styles.title}>Token Check</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <WalletMultiButton />
      <h1 className={styles.title}>Token Check</h1>
      {loading ? (
        <p className={styles.message}>Checking for token...</p>
      ) : (
        <p className={styles.message}>Connect your wallet to check for the token.</p>
      )}
    </div>
  );
}