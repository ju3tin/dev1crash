// src/dbConfig/dbConfig.ts

import mongoose from 'mongoose';

let isConnected = false;

export async function connect() {
    if (isConnected || mongoose.connection.readyState === 1) return;

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set. Add it to .env.local');
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const connection = mongoose.connection;

        connection.on('connected', () => {
            isConnected = true;
            console.log('MongoDB connected successfully');
        });

        connection.on('error', (err) => {
            console.log('MongoDB connection error ' + err);
            isConnected = false;
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
}