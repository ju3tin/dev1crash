"use client";

import { useState } from "react";
import * as solanaWeb3 from "@solana/web3.js";

export default function BuyChippy() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0.1);
  const [status, setStatus] = useState<string>("");

  const solMint = "So11111111111111111111111111111111111111112";
  const chippyMint = "Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT";
  const jupiterQuoteApi = "https://quote-api.jup.ag/v6/quote";
  const jupiterSwapApi = "https://quote-api.jup.ag/v6/swap";
  const slippageBps = 50; // 0.5% slippage
  const connection = new solanaWeb3.Connection(
    "https://mainnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76",
    "confirmed"
  );

  let walletPublicKey: solanaWeb3.PublicKey | null = null;

  const connectWallet = async () => {
    if (!(window as any).solana) {
      setStatus("Solana wallet not found. Please install Phantom or another compatible wallet.");
      return;
    }
    try {
      const response = await (window as any).solana.connect();
      walletPublicKey = new solanaWeb3.PublicKey(response.publicKey.toString());
      setWalletAddress(walletPublicKey.toBase58());
      setStatus("Wallet connected!");
    } catch (error: any) {
      setStatus("Wallet connection failed: " + error.message);
    }
  };

  const buyChippy = async () => {
    if (!walletPublicKey) {
      setStatus("Please connect wallet first.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setStatus("Invalid amount.");
      return;
    }
    const amountLamports = amount * 1e9; // SOL has 9 decimals

    setStatus("Fetching quote...");
    try {
      // Get quote
      const quoteResponse = await fetch(
        `${jupiterQuoteApi}?inputMint=${solMint}&outputMint=${chippyMint}&amount=${amountLamports}&slippageBps=${slippageBps}`
      );
      const quote = await quoteResponse.json();
      if (quote.error) throw new Error(quote.error.message || "Failed to get quote");

      // Prepare swap request
      const swapRequest = {
        quoteResponse: quote,
        userPublicKey: walletPublicKey.toBase58(),
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: 10000,
      };

      setStatus("Preparing transaction...");
      const swapResponse = await fetch(jupiterSwapApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapRequest),
      });
      const { swapTransaction } = await swapResponse.json();

      // Deserialize transaction
      const transactionBuf = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0));
      const transaction = solanaWeb3.VersionedTransaction.deserialize(transactionBuf);

      setStatus("Signing transaction...");
      // Sign with wallet
      const signedTransaction = await (window as any).solana.signTransaction(transaction);

      setStatus("Sending transaction...");
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      setStatus(`✅ Success! Transaction signature: ${signature}`);
    } catch (error: any) {
      console.error(error);
      setStatus("❌ Error: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto border rounded-2xl shadow-lg space-y-4">
      {/* Connect Wallet */}
      <button
        onClick={connectWallet}
        disabled={!!walletAddress}
        className={`px-4 py-2 rounded-lg w-full ${
          walletAddress ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 text-white"
        }`}
      >
        {walletAddress ? "Wallet Connected" : "Connect Wallet"}
      </button>

      {/* Wallet Address */}
      {walletAddress && (
        <p className="text-sm text-gray-700 break-all">Connected: {walletAddress}</p>
      )}

      {/* Amount Input */}
      <div className="space-y-1">
        <label htmlFor="amount" className="block font-medium">
          Amount of SOL to spend:
        </label>
        <input
          type="number"
          id="amount"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Buy Button */}
      <button
        onClick={buyChippy}
        disabled={!walletAddress}
        className={`px-4 py-2 rounded-lg w-full ${
          walletAddress ? "bg-green-600 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        Buy $CHIPPY
      </button>

      {/* Status */}
      <p className="text-sm text-gray-800">{status}</p>
    </div>
  );
}
