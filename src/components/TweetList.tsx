// components/TweetList.tsx
"use client";
type Tweet = {
    _id: string;
    walletAddress: string;
    tweet: string;
    date: string;
    __v: number;
  };
  
  interface TweetListProps {
    tweets: Tweet[];
  }
  
  const TweetList: React.FC<TweetListProps> = ({ tweets }) => {
    return (
      <div>
        {tweets.length === 0 ? (
          <p>No tweets available.</p>
        ) : (
          tweets.map((tweet) => (
            <div key={tweet._id} className="tweet">
              <p><strong>Wallet Address:</strong> {tweet.walletAddress}</p>
              <p>
                <strong>Tweet:</strong>{" "}
                <a href={tweet.tweet} target="_blank" rel="noopener noreferrer">
                  {tweet.tweet}
                </a>
              </p>
              <p><strong>Date:</strong> {new Date(tweet.date).toLocaleString()}</p>
              <hr />
            </div>
          ))
        )}
      </div>
    );
  };
  
  export default TweetList;
  