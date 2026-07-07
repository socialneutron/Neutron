/**
 * config/cloudinary.js
 * Cloudinary SDK configuration.
 * Exposes the configured v2 instance used across the app.
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // Always use HTTPS URLs
});

/**
 * Upload a file buffer to Cloudinary.
 * Returns the full Cloudinary upload result (includes .secure_url, .public_id).
 *
 * @param {Buffer} buffer      - File buffer from Multer memoryStorage
 * @param {string} folder      - Cloudinary folder path (e.g. "neutron/avatars")
 * @param {object} [options]   - Extra cloudinary.uploader.upload_stream options
 * @returns {Promise<object>}  - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Handles images AND videos
        quality: 'auto:good',
        fetch_format: 'auto',  // Serve WebP/AVIF when browser supports it
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    // Pipe the buffer into the upload stream
    const streamifier = require('streamifier');
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Delete an asset from Cloudinary by its public_id.
 *
 * @param {string} publicId       - Cloudinary public_id
 * @param {string} [resourceType] - 'image' | 'video' | 'raw'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
