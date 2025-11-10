// lib/deposit.js
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { getProgram } from "./anchor8"; // your helper to initialize the Solana program

const PROGRAM_ID = new PublicKey("8zEsXxhNZH2toK1Bjn3zt9jpC4JneTbYw1wMYXw7gcjS");

/**
 * Deposit SOL into the program vault for a given wallet.
 * @param {string} wallet - The user's public key (base58 string)
 * @param {number|string} amount - Amount of SOL to deposit
 * @returns {Promise<string>} Transaction signature
 */
export async function deposit(wallet, amount) {
  try {
    if (!wallet || !amount) {
      throw new Error("Missing wallet or amount");
    }

    const program = await getProgram();
    const userWallet = new PublicKey(wallet);
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_balance"), userWallet.toBytes()],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID);

    const tx = await program.methods
      .deposit(new BN(lamports))
      .accounts({
        user: userPda,
        userWallet,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit successful:", tx);
    return tx;
  } catch (e) {
    console.error("Deposit error:", e);
    throw new Error(e.message || "Failed to deposit");
  }
}
