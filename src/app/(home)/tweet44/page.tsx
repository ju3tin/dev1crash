// pages/tweets.tsx
"use client";
import React from 'react';

// Define a TypeScript type for the tweet object
type Tweet = {
  _id: string;
  walletAddress: string;
  tweet: string;
  date: string;
  __v: number;
};

// Component to display each tweet
const TweetComponent: React.FC<{ tweet: Tweet }> = ({ tweet }) => {
  return (
    <div className="tweet">
      <p><strong>Wallet Address:</strong> {tweet.walletAddress}</p>
      <p><strong>Tweet:</strong> <a href={tweet.tweet} target="_blank" rel="noopener noreferrer">{tweet.tweet}</a></p>
      <p><strong>Date:</strong> {new Date(tweet.date).toLocaleString()}</p>
      <hr />
    </div>
  );
};

// Fetch tweets from API using getServerSideProps
export async function getServerSideProps() {
  const res = await fetch('/api/tweets'); // Replace with your actual API URL
  const data: Tweet[] = await res.json(); // Explicitly type the response as an array of tweets

  return {
    props: {
      tweets: data,
    },
  };
}

type TweetsPageProps = {
  tweets: Tweet[]; // Type the props to accept an array of tweets
};

const TweetsPage: React.FC<TweetsPageProps> = ({ tweets }) => {
  return (
    <div>
      <h1>Tweets</h1>
      {tweets.length === 0 ? (
        <p>No tweets available.</p>
      ) : (
        tweets.map((tweet) => <TweetComponent key={tweet._id} tweet={tweet} />)
      )}
    </div>
  );
};

export default TweetsPage;
