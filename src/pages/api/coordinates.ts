import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Coordinate from '../../models/coordinates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  // Connect to MongoDB
  await dbConnect();

  if (method === 'GET') {
    try {
      // Extract uniqueName from query parameters
      const { uniqueName } = req.query;

      // Validate uniqueName
      if (!uniqueName || typeof uniqueName !== 'string') {
        return res.status(400).json({ message: 'uniqueName is required and must be a string' });
      }

      // Fetch the cordin by its 'uniqueName'
      const cordin = await Coordinate.findOne({ uniqueName });

      if (!cordin) {
        return res.status(404).json({ message: 'Coordinate not found' });
      }

      // Respond with the cordin data, including isAvailable
      res.status(200).json(cordin);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not wroking' });
    }
  } else if (method === 'PUT') {
    try {
      // Extract uniqueName from query parameters
      const { uniqueName } = req.query;
      const { xvalue, yvalue } = req.body;

      // Validate inputs
      if (!uniqueName || typeof uniqueName !== 'string') {
        return res.status(400).json({ message: 'uniqueName is required and must be a string' });
      }
      if (!xvalue || !yvalue) {
        return res.status(400).json({ message: 'URL, yvalue text, and isAvailable (boolean) are required' });
      }

      // Update the cordin by 'uniqueName'
      const updatedCoordinate = await Coordinate.findOneAndUpdate(
        { uniqueName }, // Find the cordin by 'uniqueName'
        { xvalue, yvalue }, // Update xvalue, yvalue, and isAvailable
        { new: true } // Return the updated document
      );

      if (!updatedCoordinate) {
        return res.status(404).json({ message: 'Coordinate not found' });
      }

      // Respond with the updated cordin
      res.status(200).json(updatedCoordinate);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not working' });
    }
  } else if (method === 'POST') {
    try {
      // Create a new cordin
      const { uniqueName, xvalue, yvalue } = req.body;

      // Check if all required fields are provided
      if (!uniqueName || !xvalue || !yvalue ) {
        return res.status(400).json({ message: 'uniqueName, URL, yvalue text, and isAvailable (boolean) are required' });
      }

      // Check if an cordin with the same uniqueName already exists
      const existingCoordinate = await Coordinate.findOne({ uniqueName });
      if (existingCoordinate) {
        return res.status(400).json({ message: 'An cordin with this uniqueName already exists' });
      }

      // Create and save the new cordin
      const newCoordinate = new Coordinate({ uniqueName, xvalue, yvalue });
      await newCoordinate.save();

      // Respond with the created cordin
      res.status(201).json(newCoordinate);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: 'not working' });
    }
  } else {
    // If method is not GET, PUT, or POST
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}