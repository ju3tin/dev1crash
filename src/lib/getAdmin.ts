import { Connection } from "@solana/web3.js";
import { ConfigAccount, ConfigSchema } from "./configSchema";
import { getConfigPda } from "./configPda";
import * as borsh from "borsh";
import bs58 from "bs58";

export async function getAdmin(): Promise<string | null> {
  const connection = new Connection("https://api.devnet.solana.com");
  const configPda = getConfigPda();

  const info = await connection.getAccountInfo(configPda);
  if (!info) return null;

  const decoded = borsh.deserialize(
    ConfigSchema,
    ConfigAccount,
    info.data
  );

  return bs58.encode(Buffer.from(decoded.admin.toString()));
}
