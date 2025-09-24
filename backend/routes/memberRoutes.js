// routes/memberRoutes.js
const express = require('express');
// Ensure createMember is imported from the controller
const { getAllMembers, getMemberById, createMember } = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/auth'); // Import middleware

const router = express.Router();

// Define routes for members
router.route('/')
  .get(protect, authorize('admin'), getAllMembers)   // Existing GET route
  .post(protect, authorize('admin'), createMember); // <--- ENSURE THIS LINE IS PRESENT FOR POST REQUESTS

router.route('/:id')
  .get(getMemberById); // Public: anyone can view a single member profile

module.exports = router;
