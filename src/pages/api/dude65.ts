import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let tokenAddress = new PublicKey(
  "48gpnn8nsmkvkgso7462Z1nFhUrprGQ71u1YLBPzizbY",
);

let tokenBalance = await connection.getTokenAccountBalance(tokenAddress);

console.log(tokenBalance);