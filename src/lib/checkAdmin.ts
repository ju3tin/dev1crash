/**
 * Client-side utility function to check if a user is admin
 * @param walletAddress - The wallet address to check
 * @returns Promise with admin status and admin address
 */
export async function checkAdmin(walletAddress: string): Promise<{
  success: boolean;
  isAdmin: boolean;
  walletAddress: string;
  adminAddress?: string;
  error?: string;
}> {
  try {
    if (!walletAddress) {
      return {
        success: false,
        isAdmin: false,
        walletAddress: '',
        error: 'Wallet address is required',
      };
    }

    const response = await fetch('/api/helius/checkAdmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        isAdmin: false,
        walletAddress,
        error: data.error || 'Failed to check admin status',
      };
    }

    return {
      success: data.success,
      isAdmin: data.isAdmin || false,
      walletAddress: data.walletAddress || walletAddress,
      adminAddress: data.adminAddress,
    };
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return {
      success: false,
      isAdmin: false,
      walletAddress,
      error: error.message || 'Network error while checking admin status',
    };
  }
}

