    require('dotenv').config(); // Load environment variables from .env file

    // --- START DEBUGGING LOGS ---
    console.log('\n--- Sequelize CLI Config Debugging ---');
    console.log('Current Working Directory:', process.cwd());
    console.log('.env file path attempts (dotenv): This is handled internally by dotenv based on CWD.');
    console.log('DB_USERNAME (from process.env):', process.env.DB_USERNAME);
    console.log('DB_PASSWORD (from process.env):', process.env.DB_PASSWORD ? '******** (masked)' : '[Not set or Empty]');
    console.log('DB_NAME (from process.env):', process.env.DB_NAME);
    console.log('DB_HOST (from process.env):', process.env.DB_HOST);
    console.log('DB_DIALECT (from process.env):', process.env.DB_DIALECT);
    console.log('-------------------------------------\n');
    // --- END DEBUGGING LOGS ---

    module.exports = {
      development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || "mysql"
      },
      test: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_TEST_NAME || "labtim_test_db",
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || "mysql"
      },
      production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || "mysql"
      }
    };
    