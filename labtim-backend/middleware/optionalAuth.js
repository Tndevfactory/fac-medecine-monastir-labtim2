// middleware/optionalAuth.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user from token to the request object
      // Exclude sensitive fields like password
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
      });

      next(); // Continue to the next middleware/route handler
    } catch (error) {
      console.error('Error in optionalProtect middleware:', error.message);
      // If token is invalid or expired, just proceed without req.user
      // Do NOT send 401/403 here, as it's optional protection
      next();
    }
  } else {
    // No token provided, just proceed without req.user
    next();
  }
};

module.exports = optionalProtect;
