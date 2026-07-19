/**
 * middleware/upload.js
 * Multer configuration using memoryStorage (buffer → Cloudinary).
 * Validates file types, size limits, and field names.
 */

const multer  = require('multer');
const ApiError = require('../utils/ApiError');

// Store files in memory (no disk write) — uploaded directly to Cloudinary
const storage = multer.memoryStorage();

/**
 * File filter factory.
 * Accepts images, videos, or both based on the 'type' argument.
 */
const fileFilter = (type = 'image') => (_req, file, cb) => {
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'];

  let allowed;
  if (type === 'image') allowed = IMAGE_TYPES;
  else if (type === 'video') allowed = VIDEO_TYPES;
  else allowed = [...IMAGE_TYPES, ...VIDEO_TYPES];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        415,
        `Unsupported file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`
      ),
      false
    );
  }
};

// ── Multer instances ──────────────────────────────────────────────────

/**
 * Wraps a multer middleware in error handling so Multer errors
 * are forwarded as ApiErrors (not Express 500s).
 */
const handleMulterError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      // Known Multer errors (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, etc.)
      const messages = {
        LIMIT_FILE_SIZE:  'File too large. Check the size limit for this endpoint.',
        LIMIT_FILE_COUNT: 'Too many files. Maximum 10 files per post.',
        LIMIT_UNEXPECTED_FILE: 'Unexpected field name in upload.',
      };
      return next(new ApiError(413, messages[err.code] || err.message));
    }

    // Custom errors from fileFilter
    if (err instanceof ApiError) return next(err);

    next(new ApiError(500, 'File upload failed.'));
  });
};

/** Single avatar / cover photo — max 5 MB */
const uploadSingleImage = handleMulterError(
  multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: fileFilter('image'),
  }).single('image')
);

/** Up to 10 mixed media files for a post — max 25 MB each */
const uploadPostMedia = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: fileFilter('any'),
}).array('media', 10);

/** Single message attachment — max 10 MB */
const uploadMessageMedia = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter('any'),
}).single('media');

module.exports = {
  uploadSingleImage,
  uploadPostMedia: handleMulterError(uploadPostMedia),
  uploadMessageMedia: handleMulterError(uploadMessageMedia),
};
