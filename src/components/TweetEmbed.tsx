"use client";

import { Tweet } from 'react-tweet';

export function TweetEmbed({ id }: { id: string }) {
  return (
    <div className="not-prose">
      <Tweet id={id} />
    </div>
  );
}

