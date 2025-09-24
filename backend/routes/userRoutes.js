// routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize'); // Import Op for Sequelize operators

// IMPORTANT: Load models from the centralized models/index.js via the 'db' object
const db = require('../models'); // Corrected import path
const User = db.User;             // Access User model
const { protect, authorize } = require('../middleware/auth');
const optionalProtect = require('../middleware/optionalAuth'); // NEW: Import optionalProtect
const bcrypt = require('bcryptjs'); // Needed if generating passwords in backend directly

const userController = require('../controllers/userController');

const router = express.Router();

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profile_images');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  console.log('File filter hit for file:', file.originalname, 'Mime type:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});
// --- End Multer Configuration ---

// Public routes for members list and profile
// These routes do NOT require any authentication token.
router.get('/', optionalProtect, userController.getAllUsers); // Use optionalProtect here
router.get('/:id', userController.getUserById); // Public access for a single member profile



// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only) - now with expiration filter
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const includeExpired = req.query.includeExpired === 'true'; // Check for query param

    const whereClause = {};
    if (!includeExpired) {
      // Filter for users whose expirationDate is NULL OR expirationDate is greater than current date
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      whereClause.expirationDate = {
        [Op.or]: [
          { [Op.gt]: currentDate }, // expirationDate is in the future
          { [Op.is]: null } // expirationDate is NULL (never expires)
        ]
      };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] } // Exclude password hash from response
    });
    // --- MODIFIED HERE: Standardize response format ---
    res.status(200).json({ success: true, count: users.length, data: users });
    // --- END MODIFIED ---
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization: Admin can view any user, regular user can only view their own profile
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user profile' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), upload.single('profileImage'), async (req, res, next) => {
  try {
    const {
      email, password, name, role, mustChangePassword,
      position, phone, orcid, biography,
      expertises, researchInterests, universityEducation,
      expirationDate // Capture expirationDate from payload
    } = req.body;

    // Check if user with this email already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      // If a file was uploaded, delete it as user creation failed
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file on user creation error:', err);
        });
      }
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const userData = {
      email,
      password,
      name: name || null,
      role: role || 'member',
      mustChangePassword: mustChangePassword === 'true',
      position: position || null,
      phone: phone || null,
      orcid: orcid || null,
      biography: biography || null,
      // Parse array-like fields from JSON string
      expertises: expertises ? JSON.parse(expertises) : [],
      researchInterests: researchInterests ? JSON.parse(researchInterests) : [],
      universityEducation: universityEducation ? JSON.parse(universityEducation) : [],
      expirationDate: expirationDate || null, // Use provided expirationDate or null
    };

    if (req.file) {
      userData.image = `/uploads/profile_images/${req.file.filename}`; // Correct path for serving static files
    }

    // Sequelize hooks in User.js handle password hashing and default expirationDate setting
    const newUser = await User.create(userData);

    // Return the new user (excluding password hash)
    const { password: userPassword, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json({ success: true, message: 'User created successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Error creating user:', error);
    // If an error occurs during creation and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file on create error:', err);
      });
    }
    next(error); // Pass error to global error handler
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
router.put('/:id', protect, upload.single('profileImage'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, role, password, mustChangePassword,
      position, phone, orcid, biography,
      expertises, researchInterests, universityEducation,
      image: existingImageControl, // This captures the 'image' field from formData (e.g., empty string for deletion)
      expirationDate // Capture expirationDate from payload
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      // If a file was uploaded, delete it as user not found
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file on update error (user not found):', err);
        });
      }
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization: Admin can update any user, regular user can only update their own profile
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      // If a file was uploaded, delete it as not authorized
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file on update error (unauthorized):', err);
        });
      }
      return res.status(403).json({ success: false, message: 'Not authorized to update this user profile' });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name === '' ? null : name;
    if (role !== undefined) updateData.role = role;
    if (position !== undefined) updateData.position = position === '' ? null : position;
    if (phone !== undefined) updateData.phone = phone === '' ? null : phone;
    if (orcid !== undefined) updateData.orcid = orcid === '' ? null : orcid;
    if (biography !== undefined) updateData.biography = biography === '' ? null : biography;
    if (expertises !== undefined) updateData.expertises = JSON.parse(expertises);
    if (researchInterests !== undefined) updateData.researchInterests = JSON.parse(researchInterests);
    if (universityEducation !== undefined) updateData.universityEducation = JSON.parse(universityEducation);
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate === '' ? null : expirationDate; // Handle explicit setting/clearing


    if (password) { // Only update password if provided
      updateData.password = password; // Hashing handled by model hook
      updateData.mustChangePassword = false; // Admin setting password means user doesn't need to change
    } else if (mustChangePassword !== undefined) {
      // If password is not provided, but mustChangePassword is, update it
      updateData.mustChangePassword = mustChangePassword === 'true';
    }


    // Image handling logic:
    if (req.file) {
      // New image uploaded, delete old one if exists, then update path
      if (user.image) {
        const oldImageFileName = path.basename(user.image);
        const oldImagePath = path.join(__dirname, '../uploads/profile_images', oldImageFileName);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old profile image:', err);
          });
        }
      }
      updateData.image = `/uploads/profile_images/${req.file.filename}`;
    } else if (existingImageControl === '') {
      // Frontend explicitly sent an empty string for the 'image' field, meaning delete current image
      if (user.image) { // Only delete if an image actually exists
        const oldImageFileName = path.basename(user.image);
        const oldImagePath = path.join(__dirname, '../uploads/profile_images', oldImageFileName);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old profile image (explicit clear):', err);
          });
        }
      }
      updateData.image = null; // Set image to null in DB
    }
    // If no req.file and existingImageControl is NOT '', it means frontend wants to keep existing image.
    // In this case, we simply don't include 'image' in updateData, and Sequelize will preserve it.


    // The beforeUpdate hook in User model will handle extending expirationDate
    // if other profile fields change, and no explicit expirationDate was provided in the payload.
    await user.update(updateData);

    // Return the updated user (excluding password hash)
    const { password: userPassword, ...userWithoutPassword } = user.toJSON();
    res.status(200).json({ success: true, message: 'Informations mises à jour avec succès', user: userWithoutPassword });

  } catch (error) {
    console.error('Error updating user:', error);
    // If an error occurs during update and a new file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting new uploaded file on update error:', err);
      });
    }
    next(error);
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete associated image file from server if it exists
    if (user.image) {
      const imageFileName = path.basename(user.image);
      // IMPORTANT: Ensure this path is correct relative to where server.js is run and where 'uploads' is.
      // Use the base 'uploads' directory, not 'uploads/profile_images' twice.
      const oldImagePath = path.join(__dirname, '../uploads/profile_images', imageFileName); // Corrected path back to profile_images
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting profile image on user delete:', err);
        });
      }
    }

    await user.destroy(); // Perform hard delete
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// NEW ROUTE: Send credentials email
router.post('/:id/send-credentials', protect, authorize('admin'), userController.sendUserCredentialsEmail);

module.exports = router;
