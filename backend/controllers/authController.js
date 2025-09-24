// backend/controllers/authController.js
const db = require("../models"); // Centralized db object
const User = db.User; // Access the User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Import crypto for token generation
const {
  sendCredentialsEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService"); // Import new function

// Helper function to generate JWT token with full user payload
const generateToken = (user) => {
  let formattedExpirationDate = null;
  if (user.expirationDate) {
    let dateObj;
    if (user.expirationDate instanceof Date) {
      dateObj = user.expirationDate;
    } else if (typeof user.expirationDate === "string") {
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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (for initial user registration) or Private (for admin adding members)
exports.registerUser = async (req, res, next) => {
  const {
    email,
    password,
    role = "member",
    name,
    position,
    phone,
    image,
    orcid,
    biography,
    expertises,
    researchInterests,
    universityEducation,
  } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User with this email already exists.",
        });
    }

    let userRole = "member";
    if (
      req.user &&
      req.user.role === "admin" &&
      ["admin", "member"].includes(role)
    ) {
      userRole = role;
    }

    const newUser = await User.create({
      email,
      password,
      role: userRole,
      name,
      position,
      phone,
      image,
      orcid,
      biography,
      expertises,
      researchInterests,
      universityEducation,
      mustChangePassword: false,
    });

    const token = generateToken(newUser);
    const { password: userPasswordHash, ...userData } = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      token,
      user: {
        ...userData,
        mustChangePassword: newUser.mustChangePassword,
        expirationDate: newUser.expirationDate,
        isArchived: newUser.isArchived,
      },
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.unscoped().findOne({
      where: { email },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.isArchived) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Your account has been archived and is no longer active. Please contact support.",
        });
    }

    if (await user.matchPassword(password)) {
      if (user.expirationDate && new Date() > new Date(user.expirationDate)) {
        if (!user.isArchived) {
          user.isArchived = true;
          await user.save({ fields: ["isArchived"] });
        }
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account has expired. Please contact an administrator.",
          });
      }

      const token = generateToken(user);
      const { password: userPasswordHash, ...userData } = user.toJSON();

      res.json({
        success: true,
        message: "Logged in successfully!",
        token,
        user: {
          ...userData,
          mustChangePassword: user.mustChangePassword,
          expirationDate: user.expirationDate,
          isArchived: user.isArchived,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during user login:", error);
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!(await user.matchPassword(oldPassword))) {
      return res
        .status(400)
        .json({ success: false, message: "Ancien mot de passe incorrect." });
    }

    user.password = newPassword;
    user.mustChangePassword = false;

    await user.save({ fields: ["password", "mustChangePassword"] });

    const token = generateToken(user);
    const { password: userPasswordHash, ...userData } = user.toJSON();

    res.status(200).json({
      success: true,
      message: "Mot de passe mis à jour avec succès.",
      token,
      user: {
        ...userData,
        mustChangePassword: user.mustChangePassword,
        expirationDate: user.expirationDate,
        isArchived: user.isArchived,
      },
    });
  } catch (error) {
    console.error("Error changing password:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    next(error);
  }
};

// @desc    Handle initial password setup (first login)
// @route   PUT /api/auth/initial-password-setup
// @access  Private (only for users with mustChangePassword: true)
exports.initialPasswordSetup = async (req, res, next) => {
  const { newPassword } = req.body;
  const { action } = req.body;

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.mustChangePassword) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Password change not required for this account.",
        });
    }

    if (action === "change") {
      if (!newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "New password is required." });
      }

      user.password = newPassword;
      user.mustChangePassword = false;

      await user.save({ fields: ["password", "mustChangePassword"] });

      const token = generateToken(user);
      const { password: userPasswordHash, ...userData } = user.toJSON();

      return res.status(200).json({
        success: true,
        message: "Mot de passe initial mis à jour avec succès.",
        token,
        user: {
          ...userData,
          mustChangePassword: user.mustChangePassword,
          expirationDate: user.expirationDate,
          isArchived: user.isArchived,
        },
      });
    } else if (action === "keep") {
      user.mustChangePassword = false;
      await user.save({ fields: ["mustChangePassword"] });

      const token = generateToken(user);
      const { password: userPasswordHash, ...userData } = user.toJSON();

      return res.status(200).json({
        success: true,
        message: "Mot de passe temporaire confirmé.",
        token,
        user: {
          ...userData,
          mustChangePassword: user.mustChangePassword,
          expirationDate: user.expirationDate,
          isArchived: user.isArchived,
        },
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action specified." });
    }
  } catch (error) {
    console.error("Error during initial password setup:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    const { password, ...userData } = user.toJSON();
    res.status(200).json({
      success: true,
      user: {
        ...userData,
        mustChangePassword: user.mustChangePassword,
        expirationDate: user.expirationDate,
        isArchived: user.isArchived,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    next(error);
  }
};

// @desc    Check if any users exist in the database
// @route   GET /api/auth/check-users-exist
// @access  Public
exports.checkUsersExist = async (req, res, next) => {
  try {
    const userCount = await User.count();
    res.status(200).json({ exists: userCount > 0 });
  } catch (error) {
    console.error("Error checking for existing users:", error);
    next(error);
  }
};

// @desc    Register the first admin user if no users exist
// @route   POST /api/auth/initial-signup
// @access  Public (only if no users exist)
exports.initialAdminSignup = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const userCount = await User.count();
    if (userCount > 0) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Initial admin signup is only allowed when no users exist.",
        });
    }

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Name, email, and password are required for initial admin signup.",
        });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: "admin",
      mustChangePassword: false,
      isArchived: false,
    });

    const token = generateToken(newAdmin);

    const { password: adminPasswordHash, ...adminData } = newAdmin.toJSON();

    res.status(201).json({
      success: true,
      message: "Initial admin user created successfully!",
      token,
      user: {
        ...adminData,
        mustChangePassword: newAdmin.mustChangePassword,
        expirationDate: newAdmin.expirationDate,
        isArchived: newAdmin.isArchived,
      },
    });
  } catch (error) {
    console.error("Error during initial admin signup:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    if (
      error.name === "SequelizeUniqueConstraintError" &&
      error.fields &&
      error.fields.email
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "An account with this email already exists.",
        });
    }
    next(error);
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Send a generic success message even if user not found to prevent email enumeration
      return res
        .status(200)
        .json({
          success: true,
          message:
            "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.",
        });
    }

    // Generate a reset token (plain text)
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set token expiration (1 hour)
    const resetTokenExpire = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Hash the reset token before saving to the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiration to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(resetTokenExpire);
    await user.save({ fields: ["resetPasswordToken", "resetPasswordExpire"] });

    // Create reset URL for the frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reinitialiser-mot-de-passe/${resetToken}`;

    // Send email
    try {
      await sendPasswordResetEmail(
        user.email,
        user.name || user.email,
        resetUrl
      );
      res
        .status(200)
        .json({
          success: true,
          message:
            "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.",
        });
    } catch (emailError) {
      // If email sending fails, clear the token from the user to prevent invalid links
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({
        fields: ["resetPasswordToken", "resetPasswordExpire"],
      });
      console.error("Error sending password reset email:", emailError);
      return res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de l'envoi de l'email de réinitialisation.",
        });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hash the incoming token to compare with the one stored in the database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: {
          [db.Sequelize.Op.gt]: new Date(), // Check if token is not expired
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré." });
    }

    // Set new password
    user.password = newPassword; // The beforeUpdate hook will hash this
    user.mustChangePassword = false; // Password is now explicitly set
    user.resetPasswordToken = null; // Clear reset token
    user.resetPasswordExpire = null; // Clear expiration

    await user.save({
      fields: [
        "password",
        "mustChangePassword",
        "resetPasswordToken",
        "resetPasswordExpire",
      ],
    });

    const newToken = generateToken(user);
    const { password: userPasswordHash, ...userData } = user.toJSON();

    res.status(200).json({
      success: true,
      message:
        "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      token: newToken, // Log user in automatically
      user: {
        ...userData,
        mustChangePassword: user.mustChangePassword,
        expirationDate: user.expirationDate,
        isArchived: user.isArchived,
      },
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    next(error);
  }
};
