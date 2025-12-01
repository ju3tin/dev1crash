"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import * as borsh from "borsh";

// =============== ANCHOR CONFIG SCHEMA (106 bytes total) ===============
class ConfigAccount {
  admin!: Uint8Array;
  vault!: Uint8Array;
  treasury!: Uint8Array;
  tax_bps!: number;

  constructor(props: { admin: Uint8Array; vault: Uint8Array; treasury: Uint8Array; tax_bps: number }) {
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

// =============== CORRECT PROGRAM ID + PDA ===============
function getConfigPda(): PublicKey {
  const PROGRAM_ID = new PublicKey("8ZRvQgFfGCc9BoRbzFmrzWHh5YzZxzoMfwiiAZJfdzU5");

  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  return pda;
}

// =============== REACT COMPONENT ===============
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

        const info = await connection.getAccountInfo(pda);
        if (!info) {
          setError("Config account not found – have you run initialize()?");
          return;
        }

        console.log("Config PDA:", pda.toBase58());
        console.log("Data length:", info.data.length); // Should be 106

        if (info.data.length !== 106) {
          setError(`Unexpected data length: ${info.data.length} bytes (expected 106)`);
          return;
        }

        // Skip the first 8 bytes (Anchor discriminator)
        const dataWithoutDiscriminator = info.data.slice(8);

        const decoded = borsh.deserialize(ConfigSchema, ConfigAccount, dataWithoutDiscriminator);

        setAdmin(bs58.encode(decoded.admin));
        setVault(bs58.encode(decoded.vault));
        setTreasury(bs58.encode(decoded.treasury));
        setTaxBps(decoded.tax_bps);
      } catch (err: any) {
        setError(`Deserialization error: ${err.message}`);
        console.error(err);
      }
    }

    loadConfig();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Crash Game – Config Account</h1>

      {error && <p style={{ color: "red" }}><strong>Error:</strong> {error}</p>}

      <p><strong>Admin:</strong> {admin || "Loading..."}</p>
      <p><strong>Vault:</strong> {vault || "Loading..."}</p>
      <p><strong>Treasury:</strong> {treasury || "Loading..."}</p>
      <p><strong>Tax (bps):</strong> {taxBps !== null ? `${taxBps / 100}%` : "Loading..."}</p>

      <details style={{ marginTop: "20px" }}>
        <summary>Debug info (click to expand)</summary>
        <pre>{JSON.stringify({ admin, vault, treasury, taxBps }, null, 2)}</pre>
      </details>
    </main>
  );
}