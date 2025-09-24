// routes/statsRoutes.js
const express = require('express');
// IMPORTANT: Load models from the centralized models/index.js via the 'db' object
const db = require('../models'); // Corrected import path
const User = db.User;             // Access User model from the db object
const { protect, authorize } = require('../middleware/auth'); // Import auth middleware

const router = express.Router();

// @desc    Get total count of users (members + admins)
// @route   GET /api/stats/members
// @access  Private (Admin only) - or adjust access as needed
router.get('/members', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Count all users in the User model
    const count = await User.count();
    
    // Send back the count in the expected JSON format { count: number }
    res.status(200).json({ success: true, count: count });
  } catch (error) {
    console.error('Error fetching member count:', error);
    next(error); // Pass error to global error handler
  }
});

// You can add more stats endpoints here as needed, e.g.:
// router.get('/publications', protect, authorize('admin'), async (req, res, next) => { ... });
// router.get('/theses', protect, authorize('admin'), async (req, res, next) => { ... });
// router.get('/masterpfes', protect, authorize('admin'), async (req, res, next) => { ... });

module.exports = router;
