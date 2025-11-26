"use client";

import React from "react";
import { useForm } from "react-hook-form";

interface AdminConfig {
  VAULT_DISPLAY_MULTIPLIER: number;
  MAX_PAYOUT_PERCENT_OF_VAULT: number;
  MAX_SINGLE_BET_RATIO: number;
  ABSOLUTE_MAX_CRASH: number;
  VAULT_SYNC_INTERVAL: number;

  rpcUrl: string;
  vaultWallet: string;
  tokenMint: string;
  mongodbUri: string;
}

const AdminConfigForm: React.FC<{ defaultValues?: AdminConfig }> = ({
  defaultValues,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminConfig>({
    defaultValues: defaultValues || {
      VAULT_DISPLAY_MULTIPLIER: 8,
      MAX_PAYOUT_PERCENT_OF_VAULT: 0.3,
      MAX_SINGLE_BET_RATIO: 0.08,
      ABSOLUTE_MAX_CRASH: 10.0,
      VAULT_SYNC_INTERVAL: 15000,
      rpcUrl: "",
      vaultWallet: "",
      tokenMint: "",
      mongodbUri: "",
    },
  });

  const onSubmit = (data: AdminConfig) => {
    console.log("Updated Admin Config:", data);
    alert("Config saved! Check console.");
    // POST to backend here
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        maxWidth: "550px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <h2>Admin Configuration Panel</h2>

      {/* GAME & VAULT SETTINGS */}
      <fieldset style={{ padding: "10px" }}>
        <legend><strong>Crash Game / Vault Settings</strong></legend>

        <label>
          Vault Display Multiplier
          <input
            type="number"
            step="0.01"
            {...register("VAULT_DISPLAY_MULTIPLIER", { required: true, valueAsNumber: true })}
          />
          {errors.VAULT_DISPLAY_MULTIPLIER && <span>Required</span>}
        </label>

        <label>
          Max Payout % of Vault
          <input
            type="number"
            step="0.01"
            {...register("MAX_PAYOUT_PERCENT_OF_VAULT", { required: true, valueAsNumber: true })}
          />
          {errors.MAX_PAYOUT_PERCENT_OF_VAULT && <span>Required</span>}
        </label>

        <label>
          Max Single Bet Ratio
          <input
            type="number"
            step="0.01"
            {...register("MAX_SINGLE_BET_RATIO", { required: true, valueAsNumber: true })}
          />
          {errors.MAX_SINGLE_BET_RATIO && <span>Required</span>}
        </label>

        <label>
          Absolute Max Crash
          <input
            type="number"
            step="0.01"
            {...register("ABSOLUTE_MAX_CRASH", { required: true, valueAsNumber: true })}
          />
          {errors.ABSOLUTE_MAX_CRASH && <span>Required</span>}
        </label>

        <label>
          Vault Sync Interval (ms)
          <input
            type="number"
            {...register("VAULT_SYNC_INTERVAL", { required: true, valueAsNumber: true })}
          />
          {errors.VAULT_SYNC_INTERVAL && <span>Required</span>}
        </label>
      </fieldset>

      {/* BLOCKCHAIN CONFIG */}
      <fieldset style={{ padding: "10px" }}>
        <legend><strong>Blockchain Config</strong></legend>

        <label>
          RPC URL
          <input type="text" {...register("rpcUrl", { required: true })} />
          {errors.rpcUrl && <span>Required</span>}
        </label>

        <label>
          Vault Wallet (PublicKey)
          <input type="text" {...register("vaultWallet", { required: true })} />
          {errors.vaultWallet && <span>Required</span>}
        </label>

        <label>
          Token Mint (PublicKey)
          <input type="text" {...register("tokenMint", { required: true })} />
          {errors.tokenMint && <span>Required</span>}
        </label>
      </fieldset>

      {/* DATABASE CONFIG */}
      <fieldset style={{ padding: "10px" }}>
        <legend><strong>Database</strong></legend>

        <label>
          MongoDB URI
          <input type="text" {...register("mongodbUri", { required: true })} />
          {errors.mongodbUri && <span>Required</span>}
        </label>
      </fieldset>

      <button type="submit">Save Configuration</button>
    </form>
  );
};

export default AdminConfigForm;
