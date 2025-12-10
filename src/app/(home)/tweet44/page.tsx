// app/(home)/anotherPage.tsx

import TweetList from '@/components/TweetList'; // Adjust the import path
import { useEffect, useState } from 'react';

export default function AnotherPage() {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const fetchTweets = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tweets`);
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
