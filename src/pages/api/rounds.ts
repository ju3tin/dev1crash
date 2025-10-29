import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await connectToDatabase();
  const collection = db.collection('gamerounds'); // your rounds collection

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
      const totalRounds = await collection.countDocuments();
      const rounds = await collection
        .find({})
        .sort({ startTime: -1 }) // newest first
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.status(200).json({
        total: totalRounds,
        page,
        totalPages: Math.ceil(totalRounds / limit),
        rounds,
      });
    } catch (err) {
      console.error('GET rounds error:', err);
      return res.status(500).json({ message: 'Failed to fetch rounds' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
