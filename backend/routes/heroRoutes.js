// backend/routes/heroRoutes.js
const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for Hero Image Uploads ---
const heroImagesDir = path.join(__dirname, '../uploads/hero_images');
// Ensure the upload directory exists
if (!fs.existsSync(heroImagesDir)) {
  fs.mkdirSync(heroImagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, heroImagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for hero section!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});
// --- End Multer Configuration ---

// @desc    Get the single Hero section
// @route   GET /api/hero
// @access  Public
router.get('/', heroController.getHero);

// @desc    Update the single Hero section (or create if it doesn't exist)
// @route   PUT /api/hero
// @access  Private (Admin only) - uses upload.single middleware
router.put('/', protect, authorize(['admin']), upload.single('image'), heroController.updateHero);

module.exports = router;
