import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/mongodb2";
import { TweetSubmission } from "../../models/TweetSubmission";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  await connectDB();

  const tweets = await TweetSubmission.find().sort({ date: -1 }); // newest first
  res.json(tweets);
}