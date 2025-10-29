import type { NextApiRequest, NextApiResponse } from "next";
import { startGame } from "../../../lib/gameState";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  startGame();
  res.status(200).json({ message: "Game started" });
}
