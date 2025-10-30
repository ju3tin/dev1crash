"use client";

import { useState } from "react";

export default function TweetVerificationForm() {
  const [tweetText, setTweetText] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [status, setStatus] = useState("");

  const generateTweet = () => {
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterIntentUrl, "_blank");
  };

  const verifyTweet = async () => {
    if (!tweetUrl) {
      setStatus("Please paste your tweet URL.");
      return;
    }

    try {
      const res = await fetch("/api/verify-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("✅ Tweet exists and is verified!");
      } else {
        setStatus("❌ " + data.error);
      }
    } catch (error) {
      setStatus("❌ Could not verify tweet.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4 border rounded-xl shadow-lg">
      <h2 className="text-xl font-bold">Step 1: Write your tweet</h2>
      <textarea
        value={tweetText}
        onChange={(e) => setTweetText(e.target.value)}
        placeholder="Write your tweet here..."
        className="w-full border rounded-lg p-2"
        rows={3}
      />
      <button
        onClick={generateTweet}
        disabled={!tweetText}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
      >
        Post on Twitter
      </button>

      <h2 className="text-xl font-bold">Step 2: Paste your tweet link</h2>
      <input
        type="url"
        value={tweetUrl}
        onChange={(e) => setTweetUrl(e.target.value)}
        placeholder="Paste your tweet URL here"
        className="w-full border rounded-lg p-2"
      />
      <button
        onClick={verifyTweet}
        disabled={!tweetUrl}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
      >
        Verify Tweet
      </button>

      {status && <p className="text-sm text-gray-800">{status}</p>}
    </div>
  );
}
