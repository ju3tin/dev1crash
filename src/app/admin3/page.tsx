"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import * as borsh from "borsh";

// ------------------ Borsh Config Schema ------------------
class ConfigAccount {
  admin!: Uint8Array;
  vault!: Uint8Array;
  treasury!: Uint8Array;
  tax_bps!: number;

  constructor(props: {
    admin: Uint8Array;
    vault: Uint8Array;
    treasury: Uint8Array;
    tax_bps: number;
  }) {
    Object.assign(this, props);
  }
}

const ConfigSchema = new Map([
  [
    ConfigAccount,
    {
      kind: "struct",
      fields: [
        ["admin", [32]],
        ["vault", [32]],
        ["treasury", [32]],
        ["tax_bps", "u16"],
      ],
    },
  ],
]);

// ------------------ PDA Derivation ------------------
// ❗ Replace PROGRAM_ID and seeds with your actual values
function getConfigPda(): PublicKey {
  const PROGRAM_ID = new PublicKey("3rrWfUdkonmozHe14gg5xWgAGWx3MVr6iVy7P4LT1Qei");

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")], // <-- replace with real seed
    PROGRAM_ID
  );

  return pda;
}

// ------------------ React Page ------------------
export default function HomePage() {
  const [admin, setAdmin] = useState<string | null>(null);
  const [vault, setVault] = useState<string | null>(null);
  const [treasury, setTreasury] = useState<string | null>(null);
  const [taxBps, setTaxBps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const connection = new Connection("https://api.devnet.solana.com");
        const pda = getConfigPda();

        console.log("Config PDA:", pda.toBase58());

        const info = await connection.getAccountInfo(pda);

        if (!info) {
          setError("Config account not found on Devnet");
          return;
        }

        // Deserialize account
        const decoded = borsh.deserialize(
          ConfigSchema,
          ConfigAccount,
          info.data
        );

        setAdmin(bs58.encode(decoded.admin));
        setVault(bs58.encode(decoded.vault));
        setTreasury(bs58.encode(decoded.treasury));
        setTaxBps(decoded.tax_bps);
      } catch (err: any) {
        setError(err.message);
      }
    }

    loadConfig();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Config Account</h1>

      {error && <p style={{ color: "red" }}><strong>Error:</strong> {error}</p>}

      <p><strong>Admin:</strong> {admin}</p>
      <p><strong>Vault:</strong> {vault}</p>
      <p><strong>Treasury:</strong> {treasury}</p>
      <p><strong>Tax (bps):</strong> {taxBps}</p>
    </main>
  );
}
