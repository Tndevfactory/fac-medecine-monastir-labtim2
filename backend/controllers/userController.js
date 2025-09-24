// controllers/userController.js
const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { sendCredentialsEmail } = require('../utils/emailService');
const { Op } = require('sequelize');


// Helper function to generate JWT token
const generateToken = (user) => {
  let formattedExpirationDate = null;
  if (user.expirationDate) {
    let dateObj;
    if (user.expirationDate instanceof Date) {
      dateObj = user.expirationDate;
    } else if (typeof user.expirationDate === 'string') {
      dateObj = new Date(user.expirationDate);
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      formattedExpirationDate = dateObj.toISOString();
    }
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
    expirationDate: formattedExpirationDate,
    isArchived: user.isArchived,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper to get the full image URL path for frontend display
const getImageFullPath = (imageFileName) => {
  if (!imageFileName) return null;
  // If imageFileName already looks like a full URL or /uploads/ path, return as is.
  if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://') || imageFileName.startsWith('/uploads/')) {
    return imageFileName;
  }
  // Otherwise, assume it's just the filename and prepend '/uploads/'
  return `/uploads/${path.basename(imageFileName)}`;
};

// Helper to generate a random password
const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper to parse JSON fields (Crucial for expertises, researchInterests, universityEducation)
const parseUserJsonFields = (user) => {
  if (user) {
    // Ensure expertises is an array
    if (typeof user.expertises === 'string') {
      try {
        user.expertises = JSON.parse(user.expertises);
      } catch (e) {
        console.error('Error parsing expertises for user:', user.id, e);
        user.expertises = []; // Default to empty array on error
      }
    } else if (!Array.isArray(user.expertises)) {
      user.expertises = [];
    }

    // Ensure researchInterests is an array
    if (typeof user.researchInterests === 'string') {
      try {
        user.researchInterests = JSON.parse(user.researchInterests);
      } catch (e) {
        console.error('Error parsing researchInterests for user:', user.id, e);
        user.researchInterests = []; // Default to empty array on error
      }
    } else if (!Array.isArray(user.researchInterests)) {
      user.researchInterests = [];
    }

    // Ensure universityEducation is an array
    if (typeof user.universityEducation === 'string') {
      try {
        user.universityEducation = JSON.parse(user.universityEducation);
      } catch (e) {
        console.error('Error parsing universityEducation for user:', user.id, e);
        user.universityEducation = []; // Default to empty array on error
      }
    } else if (!Array.isArray(user.universityEducation)) {
      user.universityEducation = [];
    }
  }
  return user;
};


// @desc    Get all users (members)
// @route   GET /api/users
// @access  Public (for members list) or Private (for admin dashboard, with includeArchived)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { includeArchived } = req.query; 
    let whereClause = {}; // Use let because it might be modified

    // Check if user is authenticated and is an admin
    const isAdmin = req.user && req.user.role === 'admin';

    // --- START DEBUG LOGS ---
    console.log(`\n--- Backend (getAllUsers) Request ---`);
    console.log('req.query:', req.query);
    console.log('includeArchived (from query):', includeArchived);
    console.log('isAdmin (from req.user):', isAdmin);
    // --- END DEBUG LOGS ---

    // If not an admin, or if admin but includeArchived is NOT explicitly 'true',
    // then apply filters to show only active, non-archived users.
    if (!isAdmin || includeArchived !== 'true') {
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      whereClause = {
        [Op.and]: [
          {
            [Op.or]: [
              { expirationDate: { [Op.gt]: currentDate } }, // expirationDate is in the future
              { expirationDate: { [Op.is]: null } } // expirationDate is NULL (never expires)
            ]
          },
          { isArchived: false } // Explicitly filter out archived users
        ]
      };
    }
    // If isAdmin is true AND includeArchived is 'true', then whereClause remains empty,
    // which means no filters are applied, returning all users (active, expired, archived).

    // --- DEBUG LOG: Final whereClause ---
    console.log('Final whereClause for Sequelize:', JSON.stringify(whereClause, null, 2));
    // --- END DEBUG LOG ---

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }, // Exclude sensitive fields
      order: [['name', 'ASC']], // Order by name for the list
    });

    const formattedUsers = users.map(user => {
      const userData = user.toJSON();
      if (userData.image) {
        userData.image = getImageFullPath(userData.image);
      }
      return parseUserJsonFields(userData); // Parse JSON fields
    });

    res.status(200).json({ success: true, count: formattedUsers.length, data: formattedUsers });
  } catch (error) {
    console.error('Error fetching all users:', error);
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public (for member profiles) or Private (for admin/self profile)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }, // Exclude sensitive fields
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    // If the user is archived AND the request is not from an admin or the user themselves,
    // then return 404 (hide archived profiles from public/non-privileged view).
    // req.user is populated by the 'protect' middleware. If 'protect' is not used on this route, req.user will be undefined.
    if (user.isArchived && (!req.user || (req.user.role !== 'admin' && req.user.id !== user.id))) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé ou archivé.' });
    }

    const userData = user.toJSON();
    if (userData.image) {
      userData.image = getImageFullPath(userData.image);
    }
    const formattedUser = parseUserJsonFields(userData); // Parse JSON fields

    res.status(200).json({ success: true, user: formattedUser }); // Return 'user' not 'data'
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    next(error);
  }
};


// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  console.log('\n--- Backend (UserController - createUser): Request Received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  const { email, password, name, role, position, phone, orcid, biography, expertises, researchInterests, universityEducation, expirationDate } = req.body;

  const temporaryPassword = password;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting uploaded file on duplicate user:', err); });
      }
      return res.status(400).json({ success: false, message: 'Un utilisateur avec cet email existe déjà.' });
    }

    let imagePath = null;
    if (req.file) {
      // Multer's path is absolute, but we want to store relative to /uploads
      imagePath = `/uploads/${req.file.filename}`; // Store as /uploads/filename.ext
    }

    // Ensure parsing for creation as well
    const parsedExpertises = expertises ? JSON.parse(expertises) : [];
    const parsedResearchInterests = researchInterests ? JSON.parse(researchInterests) : [];
    const parsedUniversityEducation = universityEducation ? JSON.parse(universityEducation) : [];

    const newUser = await User.create({
      email,
      password: temporaryPassword,
      name: name || null,
      role: role || 'member',
      position: position || null,
      phone: phone || null,
      image: imagePath, // Store the /uploads/filename.ext path
      orcid: orcid || null,
      biography: biography || null,
      expertises: parsedExpertises,
      researchInterests: parsedResearchInterests,
      universityEducation: parsedUniversityEducation,
      expirationDate: expirationDate || null,
    });

    const newUserJson = newUser.toJSON();
    if (newUserJson.image) {
      newUserJson.image = getImageFullPath(newUserJson.image);
    }
    delete newUserJson.password;

    res.status(201).json({ success: true, data: newUserJson, message: 'Utilisateur créé avec succès.' });

  } catch (error) {
    console.error('Error creating user:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting uploaded file on create error:', err); });
    }
    next(error);
  } finally {
    console.log('--- END Backend (UserController - createUser) ---');
  }
};


// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
exports.updateUser = async (req, res, next) => {
  console.log('\n--- Backend (UserController - updateUser): Request Received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  const { name, role, password, mustChangePassword, position, phone, orcid, biography, expertises, researchInterests, universityEducation, expirationDate, image: imageControl } = req.body;

  try {
    let user = await User.findByPk(req.params.id);
    if (!user) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting orphaned file:', err); });
      }
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization check: Only admin or the user themselves can update
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting uploaded file on update error (unauthorized):', err); });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update this profile.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name === '' ? null : name;
    // Only admin can change role
    if (req.user.role === 'admin' && role !== undefined) updateData.role = role;
    
    if (position !== undefined) updateData.position = position === '' ? null : position;
    if (phone !== undefined) updateData.phone = phone === '' ? null : phone;
    if (biography !== undefined) updateData.biography = biography === '' ? null : biography;
    
    // Parse JSON fields for update
    if (expertises !== undefined) updateData.expertises = JSON.parse(expertises);
    if (researchInterests !== undefined) updateData.researchInterests = JSON.parse(researchInterests);
    if (universityEducation !== undefined) updateData.universityEducation = JSON.parse(universityEducation);
    
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate === '' ? null : expirationDate;

    if (password) {
      updateData.password = password;
      updateData.mustChangePassword = false;
    } else if (mustChangePassword !== undefined) {
      updateData.mustChangePassword = mustChangePassword === 'true';
    }

    if (orcid !== undefined && orcid !== user.orcid) {
      const existingUserWithOrcid = await User.findOne({ where: { orcid } });
      if (existingUserWithOrcid && existingUserWithOrcid.id !== user.id) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting uploaded file on duplicate ORCID:', err); });
        };
      }
      return res.status(400).json({ success: false, message: 'Cet ORCID est déjà utilisé par un autre utilisateur.' });
    } else if (orcid === undefined) {
      // If orcid is not provided in the request, keep the existing one unless explicitly cleared
      // This logic is for when orcid is not in the request body at all.
      // If it's in the body as an empty string, it will be handled by `updateData.orcid = orcid === '' ? null : orcid;`
    } else { // orcid is provided and is the same or empty to clear
      updateData.orcid = orcid === '' ? null : orcid;
    }

    // Image handling logic:
    if (req.file) { // A new file was uploaded (either original or cropped)
      // Delete old image if it exists
      if (user.image) {
        const oldImagePath = path.join(__dirname, '..', user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old profile image:', err);
          });
        }
      }
      updateData.image = `/uploads/${req.file.filename}`; // Store new image path
    } else if (imageControl === 'DELETE_IMAGE_SIGNAL') { // Frontend explicitly sent signal to remove image
        if (user.image) {
          const oldImagePath = path.join(__dirname, '..', user.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old profile image on explicit delete signal:', err);
            });
          }
        }
        updateData.image = null; // Set image to null in DB
    } else {
        // If no new file and no delete signal, implicitly keep the existing image.
        // No 'image' field is added to updateData, so Sequelize won't change it.
    }

    await user.update(updateData);

    const updatedUserJson = user.toJSON();
    if (updatedUserJson.image) {
      updatedUserJson.image = getImageFullPath(updatedUserJson.image);
    }
    delete updatedUserJson.password;

    // Generate new token with updated user data
    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully.',
      user: updatedUserJson,
      token: newToken, // Send new token
    });

  } catch (error) {
    console.error('Error updating user:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting new uploaded file on update error:', err); });
    };
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.id === user.id) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    if (user.image) {
      const imagePath = path.join(__dirname, '..', user.image); // Adjust path based on stored value
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => { if (err) console.error('Error deleting profile image on user delete:', err); });
      }
    }

    await user.destroy();
    res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    next(error);
  }
};

// @desc    Send credentials email to a user
// @route   POST /api/users/:id/send-credentials
// @access  Private (Admin only)
exports.sendUserCredentialsEmail = async (req, res, next) => {
  console.log(`\n--- Backend (UserController - sendUserCredentialsEmail): Request Received for user ID: ${req.params.id} ---`);
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const newTemporaryPassword = generateRandomPassword(12);
    console.log(`Generated new temporary password for ${user.email}: ${newTemporaryPassword}`);

    user.password = newTemporaryPassword;
    user.mustChangePassword = true;
    await user.save({ fields: ['password', 'mustChangePassword'] });

    await sendCredentialsEmail(
      user.email,
      user.name || user.email,
      user.email,
      newTemporaryPassword
    );

    res.status(200).json({ success: true, message: 'Identifiants envoyés par email avec succès. Le mot de passe a été réinitialisé temporairement.' });

  } catch (error) {
    console.error('Error in sendUserCredentialsEmail:', error);
    next(error);
  } finally {
    console.log('--- END Backend (UserController - sendUserCredentialsEmail) ---');
  }
};
