const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const mimeExtensions = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = mimeExtensions[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (mimeExtensions[file.mimetype]) {
    cb(null, true);
    return;
  }

  const error = new Error('Only JPG, JPEG, PNG, WEBP, GIF and BMP images are allowed');
  error.statusCode = 400;
  cb(error);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const uploadImage = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }

    next();
  });
};

module.exports = {
  upload,
  uploadImage,
};
