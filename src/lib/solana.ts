import { Connection, PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getTokenAccounts(wallet: string, connection: Connection) {
  try {
    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165, // Size of a token account in bytes
      },
      {
        memcmp: {
          offset: 32, // Location of the owner field in the account
          bytes: wallet, // Wallet address to filter by
        },
      },
    ];

    const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, { filters });
    return accounts.map((account) => {
      const parsedAccountInfo: any = account.account.data;
      return {
        mintAddress: parsedAccountInfo["parsed"]["info"]["mint"],
        tokenBalance: parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"],
        accountAddress: account.pubkey.toString(),
      };
    });
  } catch (error) {
    console.error("Error fetching token accounts:", error);
    return [];
  }
}

export async function checkTokenOwnership(
  wallet: string,
  mintAddress: string,
  connection: Connection
): Promise<{ hasToken: boolean; balance: number }> {
  const tokenAccounts = await getTokenAccounts(wallet, connection);
  const tokenAccount = tokenAccounts.find((account) => account.mintAddress === mintAddress);
  return {
    hasToken: !!tokenAccount,
    balance: tokenAccount ? tokenAccount.tokenBalance : 0,
  };
}