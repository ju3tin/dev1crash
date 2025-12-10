// app/tweets/page.tsx   (or any page you want)
"use client";
import { Tweet } from 'react-tweet'; // Best & lightest way in 2025

// Optional fallback if you don't want to install react-tweet
// We'll provide both versions below

type TweetData = {
  _id: string;
  walletAddress: string;
  tweet: string;
  date: string;
};

async function getTweets(): Promise<TweetData[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tweets`);

  
  

 // const data = await res.json();

  if (!res.ok) {
    console.error('Failed to fetch tweets');
    return [];
  }

  return res.json();
}

export default async function TweetsPage() {
  const tweets = await getTweets();

  // Extract tweet ID from URL like:
  // https://x.com/ju3ting/status/1966027070833902034
  // → "1966027070833902034"
  const extractTweetId = (url: string): string | null => {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Community Tweets</h1>

      {tweets.length === 0 ? (
        <p className="text-center text-gray-500">No tweets yet...</p>
      ) : (
        <div className="space-y-8">
          {tweets.map((item) => {
            const tweetId = extractTweetId(item.tweet);

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6"
              >
                {tweetId ? (
                  <>
                    {/* Beautiful embedded tweet */}
                    <div className="not-prose">
                      <Tweet id={tweetId} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Wallet: {item.walletAddress.slice(0, 6)}...{item.walletAddress.slice(-4)}</span>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  // Fallback if URL is not valid
                  <div className="text-red-500 text-sm">
                    Invalid tweet link: {item.tweet}
                    <div className="text-gray-500 mt-2">
                      Wallet: {item.walletAddress} • {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
