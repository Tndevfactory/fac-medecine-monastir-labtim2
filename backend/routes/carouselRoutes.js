// routes/carouselRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const carouselController = require('../controllers/carouselController'); // Import the new controller
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/carousel_images');
    fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for carousel!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});
// --- End Multer Configuration ---

// @desc    Get all carousel items
// @route   GET /api/carousel
// @access  Public
router.get('/', carouselController.getAllCarouselItems);

// @desc    Get single carousel item
// @route   GET /api/carousel/:id
// @access  Public
router.get('/:id', carouselController.getCarouselItemById);

// @desc    Create carousel item
// @route   POST /api/carousel
// @access  Private (Admin only) - uses upload.single middleware
router.post('/', protect, authorize('admin'), upload.single('image'), carouselController.createCarouselItem);

// @desc    Delete carousel item
// @route   DELETE /api/carousel/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), carouselController.deleteCarouselItem);

// @desc    Update order of multiple carousel items (batch reorder)
// @route   PUT /api/carousel/reorder
// @access  Private (Admin only)
router.put('/reorder', protect, authorize('admin'), carouselController.reorderCarouselItems); // MOVE THIS ROUTE UP!

// @desc    Update carousel item (general ID route)
// @route   PUT /api/carousel/:id
// @access  Private (Admin only) - uses upload.single middleware
router.put('/:id', protect, authorize('admin'), upload.single('image'), carouselController.updateCarouselItem); // THIS SHOULD BE AFTER '/reorder'

module.exports = router;
