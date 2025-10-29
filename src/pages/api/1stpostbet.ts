import type { NextApiRequest, NextApiResponse } from 'next';

interface BetRequest {
    walletAddress: string;
    betAmount: number;
    autoCashout: boolean;
    currency: string;
}

interface BetResponse {
    id: string;
    walletAddress: string;
    betAmount: number;
    autoCashout: boolean;
    currency: string;
    status: 'success' | 'error';
    message: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<BetResponse>) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            id: '',
            walletAddress: '',
            betAmount: 0,
            autoCashout: false,
            currency: '',
            status: 'error',
            message: 'Only POST requests are allowed.',
        });
    }

    const { walletAddress, betAmount, autoCashout, currency } = req.body as BetRequest;

    // Basic validation
    if (!walletAddress || !betAmount || currency === undefined || autoCashout === undefined) {
        return res.status(400).json({
            id: '',
            walletAddress,
            betAmount,
            autoCashout,
            currency,
            status: 'error',
            message: 'Missing or invalid fields in request body.',
        });
    }

    // Fake processing
    const fakeId = Math.random().toString(36).substring(2, 10);

    return res.status(200).json({
        id: fakeId,
        walletAddress,
        betAmount,
        autoCashout,
        currency,
        status: 'success',
        message: 'Fake bet placed successfully!',
    });
}