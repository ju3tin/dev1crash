import type { NextApiRequest, NextApiResponse } from "next";
import { crashGame } from "@/lib/gameState";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  crashGame();
  res.status(200).json({ message: "Game crashed manually" });
}