import type { NextApiRequest, NextApiResponse } from 'next';
import  connectToDatabase from '@/lib/mondb1';
import { TweetSubmission } from '@/models/TweetSubmission';

type Data = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { walletAddress, tweet, date } = req.body;

  if (!walletAddress ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await connectToDatabase();
    const submission = new TweetSubmission({
      walletAddress,
      tweet,
      date: new Date(date),
    });
    await submission.save();
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving to database' });
  }
}
