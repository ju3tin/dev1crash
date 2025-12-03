"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/store/walletstore1";

export default function Page() {
  const [tweetText, setTweetText] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const tweet = tweetUrl;
  const walletAddress = useWalletStore((state) => state.walletAddress);

  const date = new Date().toISOString();

  // Helius config
  const API_URL = "https://mainnet.helius-rpc.com";
  const API_KEY = "4859defa-46ae-4d87-abe4-1355598c6d76";
  const TOKEN_MINT = process.env.PROGRAM_ID6 ?? '';

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/?api-key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getTokenAccountsByOwner",
            params: [
              walletAddress,
              { mint: TOKEN_MINT },
              { encoding: "jsonParsed" },
            ],
          }),
        });

        const data = await res.json();
        const accounts = data.result?.value || [];

        if (accounts.length === 0) {
          setBalance(0);
          return;
        }

        const tokenAccount = accounts[0].pubkey;

        const balRes = await fetch(`${API_URL}/?api-key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getTokenAccountBalance",
            params: [tokenAccount],
          }),
        });

        const balData = await balRes.json();
        const value = balData.result?.value;
        setBalance(value?.uiAmount ?? 0);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  const generateTweet = () => {
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText + ' #FREECHIPPYFRIDAY')} $CHIPPY  @FishnChipsSOL`;
    window.open(twitterIntentUrl, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, tweet, date }),
      });

      const data = await res.json();
      setStatus(data.message || `✅ Tweet submitted: ${tweetUrl}`);
    } catch (error) {
      console.error(error);
      setStatus("❌ Failed to submit tweet.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4 border rounded-xl shadow-lg">
      <h1 style={{display:'none'}} className="text-xl font-bold mb-4">Token Balance</h1>

      {!walletAddress && <p className="text-gray-500">No wallet connected yet...</p>}
      {walletAddress && loading && <p>Loading balance...</p>}
      {walletAddress && error && <p className="text-red-500">Error: {error}</p>}

      {walletAddress && !loading && !error && balance !== null && (
        <>
          <p style={{display:'none'}} className="text-gray-700">Current token balance: <strong>{balance}</strong></p>

          {balance > 100 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold">Step 1: Write your tweet and don't forget to add you photo</h2>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                placeholder="Write your tweet here..."
                className="w-full border rounded-lg p-2"
                rows={3}
              />
              <button
                type="button"
                onClick={generateTweet}
                disabled={!tweetText}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
              >
                Post on Twitter
              </button>

              <h2 className="text-lg font-semibold">Step 2: Paste your tweet link</h2>
              <input
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="Paste your tweet URL here"
                className="w-full border rounded-lg p-2"
              />

              <button
                type="submit"
                disabled={!tweetUrl}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
              >
                Submit Tweet
              </button>

              {status && <p className="text-sm text-white mt-2">{status}</p>}
            </form>
          ) : (
            <p className="text-green-600 font-semibold">I'm sorry but you don't have enough chippy tokens to take part.</p>
          )}
        </>
      )}
    </div>
  );
}
