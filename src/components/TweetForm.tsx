// src/components/TweetForm.tsx
import React, { useState, useEffect } from 'react';
import { useSolana } from '../hooks/useSolana';
import axios from 'axios';

export const TweetForm = () => {
  const { publicKey, hasToken, checkToken } = useSolana();
  const [tweet, setTweet] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkToken();
  }, [publicKey]);

  const handleSubmit = async () => {
    if (!hasToken || !tweet) return;

    await axios.post('http://localhost:5000/api/tweet', {
      publicKey: publicKey?.toString(),
      tweet
    });

    setSubmitted(true);
  };

  if (!publicKey) return <p>Connect Phantom Wallet to continue.</p>;
  if (!hasToken) return <p>You must own the required Solana token to tweet.</p>;
  if (submitted) return <p>Tweet submitted!</p>;

  return (
    <div>
      <textarea value={tweet} onChange={(e) => setTweet(e.target.value)} placeholder="What's happening?" />
      <button onClick={handleSubmit}>Tweet</button>
    </div>
  );
};
