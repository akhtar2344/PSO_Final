const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary dengan credentials dari .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload single image ke Cloudinary
 * @param {Buffer} buffer - Image buffer dari multer
 * @param {string} fileName - Nama file untuk public_id
 * @returns {Promise<object>} - { url, publicId, ...metadata }
 */
const uploadImage = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `materials/${Date.now()}-${Math.random().toString(36).substring(7)}`,
        folder: 'material-management',
        quality: 'auto', // Automatic quality optimization
        fetch_format: 'auto', // Automatic format optimization
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );

    // Stream buffer ke Cloudinary
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Delete image dari Cloudinary menggunakan public_id
 * @param {string} publicId - Public ID dari Cloudinary (format: 'folder/name')
 * @returns {Promise<object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public_id dari Cloudinary URL
 * Useful untuk migrasi atau logging
 * @param {string} secureUrl - Secure URL dari Cloudinary
 * @returns {string} - Public ID
 */
const extractPublicIdFromUrl = (secureUrl) => {
  try {
    const url = new URL(secureUrl);
    const pathParts = url.pathname.split('/');
    // Format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
    const fileWithExt = pathParts[pathParts.length - 1];
    return fileWithExt.split('.')[0];
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  extractPublicIdFromUrl,
};
