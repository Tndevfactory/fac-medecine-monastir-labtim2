// routes/actusRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Actu, User } = require('../models'); // IMPORTANT: Import both Actu and User models
const { protect, authorize } = require('../middleware/auth'); // Assuming you have auth middleware

// Import the actuController to use its functions
const actuController = require('../controllers/actuController'); 

const router = express.Router();

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/actu_images');
    fs.mkdirSync(uploadPath, { recursive: true }); 
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
    cb(new Error('Only image files are allowed for actu images!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});
// --- End Multer Configuration ---


// @desc    Get all actus (NOW USES CONTROLLER)
// @route   GET /api/actus
// @access  Public
router.get('/', actuController.getAllActus); // <-- CHANGED: Now points to the controller function

// @desc    Get single actu (NOW USES CONTROLLER)
// @route   GET /api/actus/:id
// @access  Public
router.get('/:id', actuController.getActuById); // <-- CHANGED: Now points to the controller function

// @desc    Create new actu
// @route   POST /api/actus
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), upload.single('image'), actuController.createActu);

// @desc    Update actu
// @route   PUT /api/actus/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), upload.single('image'), actuController.updateActu);

// @desc    Delete actu
// @route   DELETE /api/actus/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), actuController.deleteActu);

module.exports = router;
