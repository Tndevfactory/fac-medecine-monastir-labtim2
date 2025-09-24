// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

// Middleware to protect routes (ensure user is logged in)
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to the request object (without password)
      // We find the user by ID and exclude the password field
      // Sequelize will by default include other columns like 'role'
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        console.error('Protect Middleware: User not found for decoded ID:', decoded.id);
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      console.log('Protect Middleware: User authenticated. User ID:', req.user.id, 'Role:', req.user.role);
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Protect Middleware: Token verification error or other issue:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('Protect Middleware: No token provided in authorization header.');
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Middleware to authorize users by role
const authorize = (...allowedRoles) => { // Renamed 'roles' to 'allowedRoles' for clarity
  return (req, res, next) => {
    // The `allowedRoles` array at this point will be something like `[['admin', 'member']]`
    // We need to flatten it if it contains a single array of roles
    const flattenedRoles = Array.isArray(allowedRoles[0]) && allowedRoles.length === 1
                           ? allowedRoles[0]
                           : allowedRoles;

    // --- DEBUG LOG HERE (Updated to show flattened roles) ---
    console.log('Authorize Middleware: Checking authorization for roles (received):', allowedRoles);
    console.log('Authorize Middleware: Checking authorization for roles (flattened):', flattenedRoles);
    console.log('Authorize Middleware: req.user:', req.user);
    if (req.user) {
      console.log('Authorize Middleware: req.user.id:', req.user.id, 'req.user.role:', req.user.role);
    }
    // --- END DEBUG LOG ---

    if (!req.user || !flattenedRoles.includes(req.user.role)) { // <--- USE flattenedRoles HERE
      const actualRole = req.user ? req.user.role : 'not logged in';
      console.warn(`Authorize Middleware: User role '${actualRole}' is not authorized for required roles: ${flattenedRoles.join(', ')}`);
      return res.status(403).json({ success: false, message: `User role ${actualRole} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
