import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "3rrWfUdkonmozHe14gg5xWgAGWx3MVr6iVy7P4LT1Qei"
);

export const CONFIG_SEED = "config";

export function getConfigPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    PROGRAM_ID
  )[0];
}
