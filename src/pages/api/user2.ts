import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await connectToDatabase();
  const collection = db.collection('user1');

  if (req.method === 'GET') {
    try {
      const users = await collection.find({}).toArray();
      return res.status(200).json(users);
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
