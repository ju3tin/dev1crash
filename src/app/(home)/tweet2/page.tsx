"use client";

import { useState } from "react";
import { verifyTweet } from "@/lib/verify-tweet";

export default function TweetForm() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [status, setStatus] = useState("");

  const handleVerify = async () => {
    const result = await verifyTweet(tweetUrl, "#ChippyCoin"); // required hashtag

    if (result.error) {
      setStatus("❌ " + result.error);
    } else if (!result.exists) {
      setStatus("❌ Tweet does not exist");
    } else if (!result.containsKeyword) {
      setStatus("❌ Tweet does not contain the required hashtag");
    } else {
      setStatus("✅ Tweet exists and contains the required hashtag!");
    }
  };

  return (
    <div className="p-4 space-y-3 border rounded-lg max-w-lg mx-auto">
      <input
        type="url"
        value={tweetUrl}
        onChange={(e) => setTweetUrl(e.target.value)}
        placeholder="Paste your tweet URL"
        className="w-full border rounded-lg p-2"
      />
      <button
        onClick={handleVerify}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Verify Tweet
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
