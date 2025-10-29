// lib/verify-tweet.ts

export async function verifyTweet(
    tweetUrl: string,
    requiredKeyword?: string
  ): Promise<{ exists: boolean; containsKeyword: boolean; error?: string }> {
    if (!tweetUrl.startsWith("https://twitter.com/")) {
      return { exists: false, containsKeyword: false, error: "Invalid URL" };
    }
  
    // Extract tweet ID from URL
    const match = tweetUrl.match(/status\/(\d+)/);
    if (!match) {
      return { exists: false, containsKeyword: false, error: "Invalid tweet URL" };
    }
    const tweetId = match[1];
  
    try {
      // Fetch oEmbed HTML
      const res = await fetch(
        `https://publish.twitter.com/oembed?url=https://twitter.com/ju3ting/status/1933528481847038052`
      );
  
      if (!res.ok) {
        return { exists: false, containsKeyword: false, error: "Tweet not found" };
      }
  
      const data = await res.json();
  
      const exists = !!data.html;
  
      // If keyword is provided, check if it exists in the tweet text
      let containsKeyword = true;
      if (requiredKeyword && exists) {
        const htmlText = data.html.toLowerCase();
        containsKeyword = htmlText.includes(requiredKeyword.toLowerCase());
      }
  
      return { exists, containsKeyword };
    } catch (err: any) {
      return { exists: false, containsKeyword: false, error: err.message };
    }
  }
  