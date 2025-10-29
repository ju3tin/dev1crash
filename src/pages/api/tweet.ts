import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import multer from "multer";
import { promisify } from "util";
import * as dotenv from "dotenv";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

dotenv.config();

// Configure Multer for in-memory file uploads (no disk storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadMiddleware = promisify(upload.single("image"));

// Extend ExpressRequest to include the file property
interface ExtendedRequest extends ExpressRequest {
  file?: Express.Multer.File;
}

// Ensure this interface is defined at the top of your file
interface ExtendedNextApiRequest extends NextApiRequest {
  file?: Express.Multer.File; // Define the file property
}

export const config = {
  api: { bodyParser: false }, // Required for handling file uploads
};

// Initialize Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_API_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_API_ACCESS_SECRET!,
});

export default async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    await uploadMiddleware(req as unknown as ExtendedRequest, res as unknown as ExpressResponse);

    const { tweetText } = req.body;
    if (!tweetText) return res.status(400).json({ error: "Tweet text is required" });

    let mediaId;
    if (req.file) {
      mediaId = await twitterClient.v1.uploadMedia(req.file.buffer, { mimeType: req.file.mimetype });
    }

    // Post the tweet
    const tweet = await twitterClient.v2.tweet({
      text: tweetText,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    });

    if (!tweet.data?.id) {
      return res.status(500).json({ error: "Tweet failed to post." });
    }

    const tweetUrl = `https://twitter.com/user/status/${tweet.data.id}`;

    res.status(200).json({ success: true, tweetUrl });
  } catch (error) {
    console.error("Error posting tweet:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}