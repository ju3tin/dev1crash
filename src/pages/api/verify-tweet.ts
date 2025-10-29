import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  exists: boolean;
  containsKeyword: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ exists: false, containsKeyword: false, error: "Method not allowed" });
  }

  const { tweetUrl, requiredKeyword } = req.body;

  if (!tweetUrl || typeof tweetUrl !== "string") {
    return res.status(400).json({ exists: false, containsKeyword: false, error: "Missing or invalid tweetUrl" });
  }

  // Extract tweet ID from URL
  const match = tweetUrl.match(/status\/(\d+)/);
  if (!match) {
    return res.status(400).json({ exists: false, containsKeyword: false, error: "Invalid tweet URL" });
  }
  const tweetId = match[1];

  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=https://twitter.com/ju3ting/status/1933528481847038052`
    );

    if (!response.ok) {
      return res.status(404).json({ exists: false, containsKeyword: false, error: "Tweet not found" });
    }

    const data = await response.json();
    const exists = !!data.html;

    let containsKeyword = true;
    if (requiredKeyword && exists) {
      const htmlText = data.html.toLowerCase();
      containsKeyword = htmlText.includes(requiredKeyword.toLowerCase());
    }

    return res.status(200).json({ exists, containsKeyword });
  } catch (err: any) {
    return res.status(500).json({ exists: false, containsKeyword: false, error: err.message });
  }
}
