// components/TwitterEmbed.js
import React, { useEffect } from 'react';

const TwitterEmbed = ({ tweetUrl }) => {
  useEffect(() => {
    // Load the Twitter widgets.js script
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <blockquote className="twitter-tweet">
      <a href={tweetUrl} data-theme="dark">Check out this tweet!</a>
    </blockquote>
  );
};

export default TwitterEmbed;