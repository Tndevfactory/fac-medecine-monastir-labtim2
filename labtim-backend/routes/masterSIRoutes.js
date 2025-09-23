// routes/masterSIRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const masterSIController = require('../controllers/masterSIController'); // Import the new controller

// @desc    Get all Master SIs
// @route   GET /api/mastersis
// @access  Public
router.get('/', masterSIController.getAllMasterSIs);

// @desc    Get single Master SI
// @route   GET /api/mastersis/:id
// @access  Public
router.get('/:id', masterSIController.getMasterSIById);

// @desc    Create Master SI
// @route   POST /api/mastersis
// @access  Private (Admin or Member)
router.post('/', protect, authorize(['admin', 'member']), masterSIController.createMasterSI);

// @desc    Update Master SI
// @route   PUT /api/mastersis/:id
// @access  Private (Admin or Member for their own)
router.put('/:id', protect, masterSIController.updateMasterSI);

// @desc    Delete Master SI
// @route   DELETE /api/mastersis/:id
// @access  Private (Admin or Member for their own)
router.delete('/:id', protect, masterSIController.deleteMasterSI);

module.exports = router;
