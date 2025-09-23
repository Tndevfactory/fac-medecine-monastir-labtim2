// routes/publicationRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const publicationController = require('../controllers/publicationController'); // Import the controller

// @desc    Get all publications (no search term passed here)
// @route   GET /api/publications
// @access  Public
router.get('/', publicationController.getAllPublications);

// @desc    Get single publication
// @route   GET /api/publications/:id
// @access  Public
router.get('/:id', publicationController.getPublicationById);

// @desc    Create publication
// @route   POST /api/publications
// @access  Private (Admin or Member)
router.post('/', protect, authorize(['admin', 'member']), publicationController.createPublication);

// @desc    Update publication
// @route   PUT /api/publications/:id
// @access  Private (Admin or Member for their own)
router.put('/:id', protect, publicationController.updatePublication);

// @desc    Delete publication
// @route   DELETE /api/publications/:id
// @access  Private (Admin or Member for their own)
router.delete('/:id', protect, publicationController.deletePublication);

module.exports = router;
