'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Preset images
  const presetImages = [
    {
      id: 1,
      name: 'Mountain Landscape',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop'
    },
    {
      id: 2,
      name: 'Ocean Waves',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop'
    },
    {
      id: 3,
      name: 'Forest Path',
      url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop'
    },
    {
      id: 4,
      name: 'City Skyline',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'
    },
    {
      id: 5,
      name: 'Abstract Pattern',
      url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=200&fit=crop'
    },
    {
      id: 6,
      name: 'Sunset Beach',
      url: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=1920&h=1080&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=300&h=200&fit=crop'
    }
  ];

  // Apply background image to document
  useEffect(() => {
    if (backgroundImage) {
      document.documentElement.style.setProperty('--bg-image', `url(${backgroundImage})`);
      document.body.classList.add('bg-image-applied');
    } else {
      document.documentElement.style.setProperty('--bg-image', 'none');
      document.body.classList.remove('bg-image-applied');
    }
  }, [backgroundImage]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setUploadedFile(file);
      setError('');

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let imageSrc = '';

      // If URL is provided
      if (imageUrl && !uploadedFile) {
        // Validate URL
        const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff))$/i;
        if (!urlPattern.test(imageUrl)) {
          setError('Please enter a valid image URL');
          setIsLoading(false);
          return;
        }
        imageSrc = imageUrl;
      }
      // If file is uploaded
      else if (uploadedFile) {
        // For demo purposes, we'll use the preview URL
        // In production, you'd upload to a service like Cloudinary
        imageSrc = previewUrl;
      }

      if (imageSrc) {
        setBackgroundImage(imageSrc);
        // Clear form
        setImageUrl('');
        setUploadedFile(null);
        setPreviewUrl('');
      }
    } catch (err) {
      setError('Failed to set background image');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle preset image selection
  const handlePresetSelect = (image: { url: string }) => {
    setBackgroundImage(image.url);
    setImageUrl('');
    setUploadedFile(null);
    setPreviewUrl('');
    setError('');
  };

  // Remove background image
  const handleRemoveImage = () => {
    setBackgroundImage(null);
    setImageUrl('');
    setUploadedFile(null);
    setPreviewUrl('');
    setError('');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Demo content that appears over the background */}
      <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-10 border border-white/20">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Sample Content</h2>
        <p className="text-sm text-gray-600 max-w-sm">
          This content will appear beautifully over your selected background image.
        </p>
      </div>

      {/* Background Changer Form */}
      <div className="max-w-2xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20 z-10">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Background Image Changer
        </h1>

        {/* Preset Images Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Preset Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presetImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => handlePresetSelect(image)}
                className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group ${
                  backgroundImage === image.url
                    ? 'ring-2 ring-blue-500 scale-105'
                    : 'hover:scale-105'
                }`}
                aria-label={`Select ${image.name} background`}
              >
                <img
                  src={image.thumbnail}
                  alt={image.name}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {image.name}
                </div>
                {backgroundImage === image.url && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* URL Input */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload Image
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
              />
              <span className="text-sm text-gray-500">Max 5MB</span>
            </div>
            
            {/* File Preview */}
            {previewUrl && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!imageUrl && !uploadedFile)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Applying...
              </span>
            ) : (
              'Apply Background Image'
            )}
          </button>
        </form>

        {/* Current Background Display */}
        {backgroundImage && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Current Background:</p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  className="w-16 h-12 rounded bg-cover bg-center bg-no-repeat flex-shrink-0"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {imageUrl ? imageUrl : uploadedFile?.name || 'Custom background'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {uploadedFile ? 'Uploaded image' : 'URL background'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Background Settings */}
        {backgroundImage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
            <h3 className="font-medium text-yellow-800">Background Settings</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500" 
                />
                <span className="text-yellow-800">Fixed background</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500" 
                />
                <span className="text-yellow-800">Parallax effect</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500" 
                />
                <span className="text-yellow-800">Dark overlay</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}