"use client"
import { useState } from 'react';

export default function TweetForm() {
  const [walletAddress, setWalletAddress] = useState('');
  const [tweet, setTweet] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, tweet, date }),
    });

    const data = await res.json();
    setStatus(data.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Wallet Address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        required
      />
      <textarea
        placeholder="Tweet"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
      <p>{status}</p>
    </form>
  );
}
