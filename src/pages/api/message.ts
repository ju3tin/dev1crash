import type { NextApiRequest, NextApiResponse } from 'next';

interface MessageRequest {
    walletAddress: string;
    time: string;
    message: string;
}

interface MessageResponse {
    id: string;
    walletAddress: string;
    time: string;
    message: string;
    status: 'success' | 'error';
    responseMessage: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<MessageResponse>) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            id: '',
            walletAddress: '',
            time: '',
            message: '',
            status: 'error',
            responseMessage: 'Only POST requests are allowed.',
        });
    }

    const { walletAddress, time, message } = req.body as MessageRequest;

    if (!walletAddress || !time || !message) {
        return res.status(400).json({
            id: '',
            walletAddress: walletAddress || '',
            time: time || '',
            message: message || '',
            status: 'error',
            responseMessage: 'Missing required fields.',
        });
    }

    const fakeId = Math.random().toString(36).substring(2, 10);

    return res.status(200).json({
        id: fakeId,
        walletAddress,
        time,
        message,
        status: 'success',
        responseMessage: 'Fake message received successfully!',
    });
}