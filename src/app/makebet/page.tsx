"use client";
import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN, Program } from "@project-serum/anchor";
import { useProgram } from "@/lib/anchor8"; // Update if using another lib

export default function MakeBetPage() {
  const { publicKey: wallet, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  
  const [gameId, setGameId] = useState("");
  const [betAmt, setBetAmt] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // PDAs: for simplicity, you may want to enter these manually if they're not accessible from here
  const [configPda, setConfigPda] = useState("");
  const [userPda, setUserPda] = useState("");
  const [betPda, setBetPda] = useState("");

  const handleBet = async () => {
    setStatus(null);
    if (!program || !wallet || !gameId || !betAmt || !betPda || !userPda || !configPda) {
      setStatus("Missing wallet, game, or account PDAs");
      return;
    }
    setLoading(true);
    try {
      const lamports = Math.floor(parseFloat(betAmt) * 1e9); // LAMPORTS_PER_SOL
      const tx = await program.methods.placeBet(new BN(lamports))
        .accounts({
          bet: new PublicKey(betPda),
          userBalance: new PublicKey(userPda),
          gameState: new PublicKey(gameId),
          signer: wallet,
          systemProgram: SystemProgram.programId,
          config: new PublicKey(configPda),
        })
        .transaction();

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet;
      // Sign with wallet
      const signed = await signTransaction?.(tx);
      if (!signed) throw new Error("User did not sign transaction");
      const signedTxBase64 = signed.serialize().toString("base64");

      // Send to Helius API endpoint
      const res = await fetch("/api/helius/placeBet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedTxBase64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Success: ${JSON.stringify(data)}`);
      } else {
        setStatus(`Bet failed: ${data.error || JSON.stringify(data)}`);
      }
    } catch (e: any) {
      setStatus("Error: " + (e.message || e.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 30, border: "1px solid #eee", borderRadius: 16 }}>
      <h2>Debug: Make a Bet</h2>
      <p style={{ color: 'gray', fontSize: '0.9em'}}>Enter required fields manually if needed for now.</p>
      <input
        placeholder="Game ID (pubkey)"
        value={gameId}
        onChange={e => setGameId(e.target.value)}
        style={{ display: "block", width: "100%", margin: "10px 0" }}
      />
      <input
        placeholder="Bet Account PDA"
        value={betPda}
        onChange={e => setBetPda(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 10 }}
      />
      <input
        placeholder="User Balance PDA"
        value={userPda}
        onChange={e => setUserPda(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 10 }}
      />
      <input
        placeholder="Config PDA"
        value={configPda}
        onChange={e => setConfigPda(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 10 }}
      />
      <input
        placeholder="Bet Amount (SOL)"
        value={betAmt}
        type="number"
        onChange={e => setBetAmt(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 20 }}
      />
      <button
        onClick={handleBet}
        style={{ width: "100%", padding: "12px 0", borderRadius: 8 }}
        disabled={loading}
      >
        {loading ? "Placing bet..." : "Place Bet"}
      </button>
      {status && <pre style={{ marginTop: 20, color: /success/i.test(status) ? "green" : "red" }}>{status}</pre>}
    </div>
  );
}
