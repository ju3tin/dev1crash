'use client';

import React, { useEffect, useState } from 'react';
import TwitterEmbed from '../../components/TwitterEmbed';
import Link from 'next/link';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react"


type Tweet = {
  id: string;
  url: string;
};

export default function TweetPage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    const fetchTweets = async () => {
      const res = await fetch('/data/tweets.json');
      const json = await res.json();
      setTweets(json);
    };
    fetchTweets();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Get Your Free Chips When you buy Chippy Tokens <Link href="/tweet"> Click Here On Friday</Link>
      </h1>
      <div className="space-y-6 w-full max-w-xl">
        {tweets.map((tweet) => (
          <TwitterEmbed key={tweet.id} tweetUrl={tweet.url} />
        ))}
      </div>
    </div>
  );
}
