// app/(home)/anotherPage.tsx
"use client";
import TweetList from '@/components/TweetList'; // Adjust the import path
import { useEffect, useState } from 'react';

export default function AnotherPage() {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const fetchTweets = async () => {
      const res = await fetch(`/api/tweets`);
      const data = await res.json();
      setTweets(data);
    };

    fetchTweets();
  }, []);

  return (
    <div>
      <h1>Another Page with Tweets</h1>
      <TweetList tweets={tweets} />
    </div>
  );
}
