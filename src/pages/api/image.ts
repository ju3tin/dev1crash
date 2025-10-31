import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Image from '@/models/Image';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  // Connect to MongoDB
  await dbConnect();

  if (method === 'GET') {
    try {
      // Extract imageName from query parameters
      const { imageName } = req.query;

      // Validate imageName
      if (!imageName || typeof imageName !== 'string') {
        return res.status(400).json({ message: 'imageName is required and must be a string' });
      }

      // Fetch the image by its 'imageName'
      const image = await Image.findOne({ imageName });

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Respond with the image data, including isAvailable
      res.status(200).json(image);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not wroking' });
    }
  } else if (method === 'PUT') {
    try {
      // Extract imageName from query parameters
      const { imageName } = req.query;
      const { url, alt, isAvailable } = req.body;

      // Validate inputs
      if (!imageName || typeof imageName !== 'string') {
        return res.status(400).json({ message: 'imageName is required and must be a string' });
      }
      if (!url || !alt || typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: 'URL, alt text, and isAvailable (boolean) are required' });
      }

      // Update the image by 'imageName'
      const updatedImage = await Image.findOneAndUpdate(
        { imageName }, // Find the image by 'imageName'
        { url, alt, isAvailable }, // Update url, alt, and isAvailable
        { new: true } // Return the updated document
      );

      if (!updatedImage) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Respond with the updated image
      res.status(200).json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not working' });
    }
  } else if (method === 'POST') {
    try {
      // Create a new image
      const { imageName, url, alt, isAvailable } = req.body;

      // Check if all required fields are provided
      if (!imageName || !url || !alt || typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: 'imageName, URL, alt text, and isAvailable (boolean) are required' });
      }

      // Check if an image with the same imageName already exists
      const existingImage = await Image.findOne({ imageName });
      if (existingImage) {
        return res.status(400).json({ message: 'An image with this imageName already exists' });
      }

      // Create and save the new image
      const newImage = new Image({ imageName, url, alt, isAvailable });
      await newImage.save();

      // Respond with the created image
      res.status(201).json(newImage);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not working' });
    }
  } else {
    // If method is not GET, PUT, or POST
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}