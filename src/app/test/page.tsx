"use client";

import React, { useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getAccount,
  getMint,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const TOKEN_MINT = new PublicKey("14RxG3uBSHkzpiEE3muBMxg2dEQXw2rSvzJvJatWuQ2r");
const RPC_URL = clusterApiUrl("mainnet-beta");

export default function TestPage() {
  const [ownerPubkey, setOwnerPubkey] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckBalance = async () => {
    setError(null);
    setBalance(null);
    setLoading(true);

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const owner = new PublicKey(ownerPubkey);

      // Derive associated token account (ATA)
      const ata = await getAssociatedTokenAddress(
        TOKEN_MINT,
        owner,
        false,
        TOKEN_PROGRAM_ID
      );
      const mintInfo = await getMint(connection, TOKEN_MINT);
      // Fetch account info
      const accountInfo = await getAccount(connection, ata);
      const rawAmount = accountInfo.amount; // bigint
      const decimals = mintInfo.decimals; 
      const humanAmount = Number(rawAmount) / 10 ** decimals;

      setBalance(`${humanAmount} tokens`);
    } catch (err: any) {
      if (err.message?.includes("TokenAccountNotFoundError")) {
        setError("No token account found — balance = 0");
      } else {
        console.error(err);
        setError("Error fetching balance: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1117",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "#161b22",
          padding: "2rem",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ marginBottom: "1rem", textAlign: "center" }}>
          💰 Check SPL Token Balance
        </h1>

        <label htmlFor="wallet" style={{ display: "block", marginBottom: "0.5rem" }}>
          Wallet Public Key:
        </label>
        <input
          id="wallet"
          type="text"
          value={ownerPubkey}
          onChange={(e) => setOwnerPubkey(e.target.value.trim())}
          placeholder="Enter Solana wallet address"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #30363d",
            background: "#0d1117",
            color: "#fff",
            marginBottom: "1rem",
          }}
        />

        <button
          onClick={handleCheckBalance}
          disabled={loading || !ownerPubkey}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            background: loading || !ownerPubkey ? "#30363d" : "#238636",
            color: "#fff",
            cursor: loading || !ownerPubkey ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Balance"}
        </button>

        {balance && (
          <p style={{ marginTop: "1.5rem", color: "#3fb950", textAlign: "center" }}>
            ✅ Balance: {balance}
          </p>
        )}
        {error && (
          <p style={{ marginTop: "1.5rem", color: "#f85149", textAlign: "center" }}>
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}
