import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress, username } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists with this wallet address
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(200).json({ 
        success: true,
        message: "User already exists",
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          walletAddress: existingUser.walletAddress
        }
      });
    }

    // Create new user with wallet address as username if not provided
    const newUser = new User({
      username: username || walletAddress,
      email: `${walletAddress}@wallet.local`, // Temporary email for wallet users
      password: "wallet_user", // Temporary password for wallet users
      walletAddress: walletAddress
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        walletAddress: savedUser.walletAddress
      }
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "User with this wallet address or username already exists" 
      });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}
