import type { NextApiRequest, NextApiResponse } from "next";
import { stopGame } from "@/lib/gameState";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  stopGame();
  res.status(200).json({ message: "Game stopped" });
}
