// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Ensure environment variables are loaded

// Create a new Sequelize instance to connect to MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Database name
  process.env.DB_USER,      // Database user
  process.env.DB_PASSWORD,  // Database password
  {
    host: process.env.DB_HOST, // Database host (from .env, will be 'mysql_db' for Docker)
    dialect: 'mysql',          // Specify MySQL dialect
    logging: false,            // Set to true to see detailed SQL queries in the console (useful for debugging)
    port: 3306,                // Default MySQL port
    pool: {                    // Connection pool options (for managing multiple connections)
      max: 5,                  // Maximum number of connections in pool
      min: 0,                  // Minimum number of connections in pool
      acquire: 30000,          // Maximum time (ms) that a connection can be idle before being released
      idle: 10000              // Maximum time (ms) that pool will try to get connection before throwing error
    }
  }
);

// Function to test the database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate(); // Test the connection
    console.log('MySQL Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit the process if connection fails
  }
};

module.exports = { sequelize, connectDB };
