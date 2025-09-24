// createAdmin.js
// A temporary script to create an initial admin user in the database.
// USE WITH CAUTION: This should only be run once for initial setup.

require('dotenv').config(); // Load environment variables
const bcrypt = require('bcryptjs'); // For password hashing
const db = require('./models'); // Import the centralized db object (contains sequelize and all models)

async function createInitialAdmin() {
  const adminEmail = 'admin@labtim.com'; // CHANGE THIS TO YOUR DESIRED ADMIN EMAIL
  const adminPassword = 'admin123'; // CHANGE THIS TO A STRONG, UNIQUE PASSWORD
  const adminName = 'Mohamed Hedi Bedoui'; // Optional: Set a name

  if (!adminEmail || !adminPassword) {
    console.error('Admin email and password must be provided.');
    process.exit(1);
  }

  try {
    // Connect to the database
    await db.sequelize.authenticate();
    console.log('Database connection established.');

    // IMPORTANT: Do NOT run User.sync() here.
    // The database schema (including tables and unique indexes) is now
    // managed by `server.js` on application startup.
    // This script should only insert data into an already existing table.

    // Check if an admin with this email already exists
    const existingAdmin = await db.User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log(`Admin user with email "${adminEmail}" already exists. Skipping creation.`);
      console.log('If you wish to update, please do so via a specific update script or the UI.');
    } else {
      // Hash the password before storing it
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Create the admin user
      const newAdmin = await db.User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // Set the role to 'admin'
        // isArchived: false, // Ensure account is not archived (this field is not in your original User.js)
        mustChangePassword: false, // Set to false for initial admin setup
        // accessExpiresAt: null, // Optional: Set an expiration date if needed
      });

      console.log(`Admin user "${newAdmin.email}" created successfully!`);
      console.log('Please log in with these credentials.');
    }
  } catch (error) {
    console.error('Error creating initial admin user:', error);
  } finally {
    await db.sequelize.close(); // Close the database connection
    console.log('Database connection closed.');
    process.exit(); // Exit the script
  }
}

createInitialAdmin();
