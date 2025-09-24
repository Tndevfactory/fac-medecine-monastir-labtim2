// routes/presentationRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const presentationController = require('../controllers/presentationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/presentation_images');
    fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for each uploaded image
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for presentation content!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit for presentation images
});
// --- End Multer Configuration ---

// @desc    Get the single main presentation content
// @route   GET /api/presentation/main
// @access  Public
router.get('/main', presentationController.getMainPresentation);

// @desc    Update the main presentation content
// @route   PUT /api/presentation/main
// @access  Private (Admin only)
// Use upload.fields to handle multiple named file inputs (e.g., image_0, image_1 etc.)
// The array argument specifies which fields to expect and the max count for each.
// MaxCount: Infinity is not allowed, so use a reasonable high number if dynamic
// If blocks are dynamically added, frontend needs to name them like 'image_idx'
// We will receive dynamic fields like 'image_0', 'image_1', etc.
router.put(
  '/main',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'directorImage', maxCount: 1 },
    ...Array.from({ length: 50 }, (_, i) => ({ name: `image_${i}`, maxCount: 1 }))
  ]), // Allows directorImage and up to 50 image fields
  presentationController.updateMainPresentation
);

module.exports = router;
