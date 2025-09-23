// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// NEW: Forgot Password and Reset Password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword); // Note: POST for security

// New routes for initial setup
router.get('/check-users-exist', authController.checkUsersExist);
router.post('/initial-signup', authController.initialAdminSignup);

// Private routes (require authentication)
router.put('/change-password', protect, authController.changePassword);
router.put('/initial-password-setup', protect, authController.initialPasswordSetup);
router.get('/me', protect, authController.getMe);

module.exports = router;
