// src/hooks/useSolana.ts
import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

export const useSolana = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [hasToken, setHasToken] = useState(false);

  const TOKEN_MINT = 'YOUR_TOKEN_MINT_ADDRESS_HERE'; // replace with actual token mint

  useEffect(() => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom) {
        setWallet(provider);
        provider.connect().then(({ publicKey }: any) => setPublicKey(publicKey));
      }
    }
  }, []);

  const checkToken = async () => {
    if (!publicKey) return;

    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey(process.env.TOKEN_PROGRAM_ID5 ?? '')
    });

    const ownsToken = tokenAccounts.value.some((account) => {
      return account.account.data.parsed.info.mint === TOKEN_MINT &&
             Number(account.account.data.parsed.info.tokenAmount.uiAmount) > 0;
    });

    setHasToken(ownsToken);
  };

  return { publicKey, hasToken, checkToken };
};
