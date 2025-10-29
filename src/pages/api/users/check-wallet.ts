import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Connect to database
    await connectToDatabase();

    // Check if user exists with this wallet address
    const user = await User.findOne({ walletAddress });

    if (user) {
      return res.status(200).json({ 
        exists: true, 
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress
        }
      });
    } else {
      return res.status(200).json({ 
        exists: false,
        message: "User not found with this wallet address"
      });
    }

  } catch (error: any) {
    console.error("Error checking wallet address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
