import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '@/dbConfig/dbConfig';
import { BezierSet } from '@/models/BezierFrame';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  const key = (req.query.key as string) || 'default';

  try {
    if (req.method === 'GET') {
      const doc = await BezierSet.findOne({ key });
      return res.status(200).json({
        key,
        frames: doc?.frames ?? [],
        updatedAt: doc?.updatedAt ?? null,
      });
    }

    if (req.method === 'PUT') {
      const { frames } = req.body ?? {};
      if (!Array.isArray(frames)) return res.status(400).json({ error: 'frames must be an array' });
      const doc = await BezierSet.findOneAndUpdate(
        { key },
        { $set: { frames } },
        { upsert: true, new: true }
      );
      return res.status(200).json({ key: doc.key, frames: doc.frames, updatedAt: doc.updatedAt });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


