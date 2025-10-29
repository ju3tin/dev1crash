import path from 'path';
import fs from 'fs/promises';

export type Tweet = {
  id: string;
  user: string;
  content: string;
};

export async function getTweets(): Promise<Tweet[]> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'tweets.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const tweets: Tweet[] = JSON.parse(jsonData);
  return tweets;
}