// pages/api/messages.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed.' });
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection('messages'); // replace with your collection name

        const messages = await collection.find({}).sort({ time: -1 }).toArray();

        res.status(200).json(messages);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
}