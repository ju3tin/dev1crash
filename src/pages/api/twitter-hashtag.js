export default async function handler(req, res) {
  const { hashtag } = req.query;

  if (!hashtag || hashtag.trim() === "") {
    return res.status(400).json({ error: "Hashtag query parameter is required." });
  }

  const query = encodeURIComponent(`#${hashtag}`);
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=author_id,created_at&max_results=10`;

  try {
    const twitterRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.dude2}`,
      },
    });

    if (!twitterRes.ok) {
      const errorData = await twitterRes.json();
      return res.status(twitterRes.status).json({ error: errorData });
    }

    const data = await twitterRes.json();

    return res.status(200).json({
      hashtag,
      count: data.meta?.result_count || 0,
      tweets: data.data || [],
    });
  } catch (error) {
    console.error("Twitter API error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
