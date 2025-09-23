// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import fs for directory creation

const db = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Helper function to check and create unique index
const ensureUniqueIndex = async (tableName, columnName, indexName, transaction) => {
  try {
    const [results] = await db.sequelize.query(
      `SHOW INDEXES FROM \`${tableName}\` WHERE Key_name = '${indexName}';`,
      { transaction, raw: true }
    );

    if (results.length === 0) {
      console.log(`Creating unique index '${indexName}' on ${tableName}.${columnName}...`);
      await db.sequelize.query(
        `CREATE UNIQUE INDEX \`${indexName}\` ON \`${tableName}\` (\`${columnName}\`);`,
        { transaction, raw: true }
      );
      console.log(`Unique index '${indexName}' on ${tableName}.${columnName} created successfully.`);
    } else {
      console.log(`Unique index '${indexName}' on ${tableName}.${columnName} already exists.`);
    }
  } catch (error) {
    console.error(`Error ensuring unique index '${indexName}' on ${tableName}.${columnName}:`, error);
    throw error; // Re-throw to ensure transaction rollback
  }
};


// Connect to Database and Synchronize Models
const initializeDB = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, { raw: true });
    console.log('Foreign key checks temporarily disabled.');

    // Synchronize all models. 'alter: true' will now handle non-unique field changes,
    // but unique indexes are managed manually below for stability.
    await db.sequelize.sync({ alter: true });
    console.log('All models synchronized with the database. Associations wired up.');

    // Manually ensure unique indexes for fields that should be unique
    const transaction = await db.sequelize.transaction(); // Use a transaction for index creation as well
    try {
      await ensureUniqueIndex('users', 'email', 'users_email_unique', transaction);
      await ensureUniqueIndex('users', 'orcid', 'users_orcid_unique', transaction);
      await ensureUniqueIndex('carousel_items', 'order', 'carousel_items_order_unique', transaction); // Ensure carousel order is unique
      await ensureUniqueIndex('presentation_content', 'sectionName', 'presentation_content_sectionName_unique', transaction); // Ensure sectionName is unique
      await ensureUniqueIndex('publications', 'doi', 'publications_doi_unique', transaction); // Ensure DOI is unique

      // Add similar calls for any other fields that require unique constraints
      // For example:
      // await ensureUniqueIndex('your_table', 'your_column', 'your_table_your_column_unique', transaction);

      await transaction.commit();
      console.log('All custom unique indexes ensured.');

    } catch (indexError) {
      await transaction.rollback();
      console.error('Error during custom unique index creation transaction:', indexError);
      throw indexError; // Re-throw to trigger process exit
    }


    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, { raw: true });
    console.log('Foreign key checks enabled.');

  } catch (error) {
    console.error('Unable to connect to the database or synchronize models:', error);
    process.exit(1);
  }
};

// --- CORE MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files (e.g., uploaded images) from the 'uploads' directory
// This means files in backend/uploads will be accessible via /uploads/filename.ext
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static images from the 'public/images' directory (for logo etc.)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));


// API Routes Mounting
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/send-contact-email', require('./routes/contactRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/publications', require('./routes/publicationRoutes'));
app.use('/api/theses', require('./routes/thesisRoutes'));
app.use('/api/mastersis', require('./routes/masterSIRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/carousel', require('./routes/carouselRoutes'));
app.use('/api/presentation', require('./routes/presentationRoutes'));
app.use('/api/actus', require('./routes/actusRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/hero',  require('./routes/heroRoutes'));



// Basic test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 400;
      message = 'File size too large. Maximum 5MB allowed.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      message = 'Too many files uploaded or unexpected field name.';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, token failed.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token expired.';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = `Duplicate entry for a unique field: ${err.errors[0].message || ''}`;
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeDatabaseError' && err.parent && err.parent.code === 'ER_FK_DUP_NAME') {
    statusCode = 500;
    message = 'Database synchronization error: A foreign key constraint already exists. This might be a transient issue during startup. Try restarting.';
    console.warn('Caught ER_FK_DUP_NAME in global error handler. This often indicates a transient sync issue, not a runtime app error.');
  } else if (err.name === 'SequelizeDatabaseError' && err.parent && err.parent.code === 'ER_FK_CANNOT_OPEN_PARENT') {
    statusCode = 500;
    message = 'Database synchronization error: Failed to open referenced table (e.g., Users table not found/ready). Ensure model sync order and database readiness.';
    console.error('Caught ER_FK_CANNOT_OPEN_PARENT in global error handler. This means a referenced table was not found during FK creation.');
  }


  res.status(statusCode).json({
    success: false,
    message,
  });
});

// Start server
initializeDB().then(() => {
  // THIS IS THE CRITICAL LINE FOR BACKEND ACCESSIBILITY
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT} (accessible via your local IP)`));
}).catch(err => {
  console.error('Failed to initialize database and start server due to a fatal error:', err);
});