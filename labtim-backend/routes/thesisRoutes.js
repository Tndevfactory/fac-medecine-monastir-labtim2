// routes/thesisRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const thesisController = require('../controllers/thesisController'); // Import the new controller

// @desc    Get all theses
// @route   GET /api/theses
// @access  Public
router.get('/', thesisController.getAllTheses);

// @desc    Get single thesis
// @route   GET /api/theses/:id
// @access  Public
router.get('/:id', thesisController.getThesisById);

// @desc    Create thesis
// @route   POST /api/theses
// @access  Private (Admin or Member)
router.post('/', protect, authorize(['admin', 'member']), thesisController.createThesis);

// @desc    Update thesis
// @route   PUT /api/theses/:id
// @access  Private (Admin or Member for their own)
router.put('/:id', protect, thesisController.updateThesis);

// @desc    Delete thesis
// @route   DELETE /api/theses/:id
// @access  Private (Admin or Member for their own)
router.delete('/:id', protect, thesisController.deleteThesis);

module.exports = router;
