import { PublicKey } from "@solana/web3.js";
import * as borsh from "borsh";

class ConfigAccount {
  admin: Uint8Array;
  vault: Uint8Array;

  constructor(fields: { admin: Uint8Array; vault: Uint8Array }) {
    this.admin = fields.admin;
    this.vault = fields.vault;
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
      ],
    },
  ],
]);

export { ConfigAccount, ConfigSchema };
