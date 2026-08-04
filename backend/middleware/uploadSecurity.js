const path = require('path');
const fs = require('fs');

// Permitted MIME types and their matching magic byte signatures
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF header
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates raw file buffers against MIME type, size limits, and magic byte signatures
 */
const validateFileBuffer = (buffer, mimeType) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { valid: false, message: 'Invalid or missing file buffer.' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, message: 'File size exceeds 5MB limit.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, message: `File type ${mimeType} is not supported. Allowed types: PNG, JPEG, WEBP.` };
  }

  const magic = MAGIC_BYTES[mimeType];
  if (magic) {
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) {
        return { valid: false, message: 'File content does not match expected image format signature.' };
      }
    }
  }

  return { valid: true };
};

/**
 * Storage security configuration helper:
 * Uploads are isolated in a non-executable directory with safe filename hashing
 */
const getIsolatedUploadPath = (originalFilename) => {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.img';
  const safeFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${safeExt}`;

  return {
    uploadDir,
    safeFilename,
    fullPath: path.join(uploadDir, safeFilename)
  };
};

module.exports = {
  validateFileBuffer,
  getIsolatedUploadPath,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
