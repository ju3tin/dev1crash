import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { CrashGameClient } from '../lib/client';
import { useState } from 'react';

export function BetButton({ gameId, amount }: { gameId: string; amount: number }) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const client = new CrashGameClient();

  const handlePlaceBet = async () => {
    if (!publicKey || !signTransaction) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Get the transaction from API
      const response = await client.placeBet(
        publicKey.toString(),
        gameId,
        amount
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      // Sign and send the transaction
      const signature = await client.signAndSendTransaction(
        response.transaction,
        { signTransaction },
        connection
      );

      console.log('Bet placed!', signature);
      alert(`Bet placed successfully! Signature: ${signature}`);
    } catch (error) {
      console.error('Failed to place bet:', error);
      alert('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePlaceBet} disabled={loading}>
      {loading ? 'Placing bet...' : `Place ${amount} SOL bet`}
    </button>
  );
}
