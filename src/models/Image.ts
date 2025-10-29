// models/Image.js
import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  imageName: { 
    type: String,
    required: true,
    unique: true,  // Ensures the name is unique in the database
  },
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  isAvailable: { type: Boolean, required: true } // Boolean for "yes" (true) or "no" (false)
});

const Image = mongoose.models.Image || mongoose.model('Image', ImageSchema);

export default Image;
