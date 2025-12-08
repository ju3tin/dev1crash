// lib/checkAdmin.ts
export async function checkAdmin(walletAddress: string | undefined): Promise<boolean> {
  try {
    if (!walletAddress) return false;

    const res = await fetch('/api/helius/getConfig', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error("Failed to fetch config");
      return false;
    }

    const data = await res.json();

    const adminAddress = data?.config?.admin;
    if (!adminAddress) return false;

    return adminAddress === walletAddress;
  } catch (err) {
    console.error("checkAdmin error:", err);
    return false;
  }
}
