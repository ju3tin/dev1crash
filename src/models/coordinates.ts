// models/Image.js
import mongoose from 'mongoose';

const CoordinatesSchema = new mongoose.Schema({
  uniqueName: { 
    type: String,
    required: true,
    unique: true,  // Ensures the name is unique in the database
  },
  xvalue: {
    type: String,
    required: true,
  },
  yvalue: {
    type: String,
    required: true,
  },
});

const Coordinates = mongoose.models.Coordinates || mongoose.model('Coordinates', CoordinatesSchema);

export default Coordinates;
