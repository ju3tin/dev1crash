import { deposit } from "@/lib/deposit";  // assuming you put deposit.js inside `lib` folder

/**
 * API route for depositing SOL into a game vault.
 */
export async function POST(req, res) {
  try {
    const { wallet, amount } = req.body;

    if (!wallet || !amount) {
      return res.status(400).json({ error: "Missing wallet or amount" });
    }

    const tx = await deposit(wallet, amount);

    return res.status(200).json({ success: true, tx });
  } catch (e) {
    console.error("Deposit error:", e);
    return res.status(500).json({ error: e.message || "Failed to deposit" });
  }
}
