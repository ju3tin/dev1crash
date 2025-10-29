// pages/api/messages.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await connectToDatabase();
    const collection = db.collection('messages');

    if (req.method === 'GET') {
        try {
            const messages = await collection.find({}).sort({ time: -1 }).toArray();
            return res.status(200).json(messages);
        } catch (error) {
            console.error('GET error:', error);
            return res.status(500).json({ message: 'Failed to fetch messages' });
        }
    }

    if (req.method === 'POST') {
        const { user, time, message } = req.body;
    
        if (!user || !time || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
    
        try {
            const messageCount = await collection.countDocuments();
    
            // If there are 200 or more, delete the oldest one
            if (messageCount >= 200) {
                const oldestMessage = await collection.findOne({}, { sort: { time: 1 } }); // Find the oldest message
                if (oldestMessage) {
                    await collection.deleteOne({ _id: oldestMessage._id }); // Delete the oldest message by ID
                }
            }
    
            const result = await collection.insertOne({
                user,
                time,
                message,
            });
    
            return res.status(201).json({
                message: 'Message stored successfully',
                insertedId: result.insertedId,
            });
        } catch (error) {
            console.error('POST error:', error);
            return res.status(500).json({ message: 'Failed to store message' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}