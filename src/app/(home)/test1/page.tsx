"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

// Constants
const solMint = "So11111111111111111111111111111111111111112";
const chippyMint = "Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT";
const jupiterQuoteApi = "https://quote-api.jup.ag/v6/quote";
const jupiterSwapApi = "https://quote-api.jup.ag/v6/swap";
const slippageBps = 50; // 0.5% slippage
const rpcUrl =
  "https://mainnet.helius-rpc.com/?api-key=4859defa-46ae-4d87-abe4-1355598c6d76";

const connection = new Connection(rpcUrl, "confirmed");

export default function BuyChippy() {
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string>("");

  const handleBuy = async () => {
    if (!publicKey) {
      setStatus("❌ Connect your wallet first");
      return;
    }

    const amountSol = parseFloat(amount);
    if (isNaN(amountSol) || amountSol <= 0) {
      setStatus("❌ Enter a valid SOL amount");
      return;
    }

    const amountLamports = amountSol * 1e9; // 1 SOL = 1e9 lamports

    try {
      setStatus("🔎 Fetching quote...");
      // Get Jupiter quote
      const quoteResponse = await fetch(
        `${jupiterQuoteApi}?inputMint=${solMint}&outputMint=${chippyMint}&amount=${amountLamports}&slippageBps=${slippageBps}`
      );
      const quote = await quoteResponse.json();
      if (quote.error) throw new Error(quote.error.message);

      // Build swap request
      const swapRequest = {
        quoteResponse: quote,
        userPublicKey: publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: 10000,
      };

      setStatus("⚙️ Preparing transaction...");
      const swapResponse = await fetch(jupiterSwapApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapRequest),
      });
      const { swapTransaction } = await swapResponse.json();

      // Deserialize transaction
      const transactionBuf = Uint8Array.from(atob(swapTransaction), (c) =>
        c.charCodeAt(0)
      );
      const transaction = VersionedTransaction.deserialize(transactionBuf);

      setStatus("✍️ Signing transaction...");
      if (!signTransaction) throw new Error("Wallet does not support signTransaction");
      const signedTx = await signTransaction(transaction);

      setStatus("📡 Sending transaction...");
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      setStatus("⏳ Confirming...");
      await connection.confirmTransaction(signature, "confirmed");

      setStatus(`✅ Success! Tx: ${signature}`);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-lg font-bold text-white">Buy Chippy</h2>

      <input
        type="number"
        placeholder="Amount in SOL"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="px-3 py-2 rounded-lg border text-black"
      />

      <button
        onClick={handleBuy}
        disabled={!publicKey}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
      >
        Buy Chippy
      </button>

      {status && <p className="text-sm text-gray-300 mt-2">{status}</p>}
    </div>
  );
}
