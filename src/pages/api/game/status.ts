import type { NextApiRequest, NextApiResponse } from "next";
import { getGameState } from "@/lib/gameState";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(getGameState());
}
