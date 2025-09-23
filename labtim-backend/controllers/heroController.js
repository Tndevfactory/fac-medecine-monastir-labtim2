// backend/controllers/heroController.js
const db = require('../models'); // Centralized db object
const Hero = db.Hero; // Access the Hero model
const fs = require('fs');
const path = require('path');

// Helper to get the full image URL path for frontend display
const getImageFullPath = (imageFileName) => {
  if (!imageFileName) return null;
  // Assuming 'uploads' is served statically from the root,
  // and images are stored in 'uploads/hero_images'.
  return `/uploads/hero_images/${path.basename(imageFileName)}`;
};

// @desc    Get the single Hero section
// @route   GET /api/hero
// @access  Public
exports.getHero = async (req, res, next) => {
  try {
    // Find the first (and only) hero record. If none exists, create a default one.
    let hero = await Hero.findOne();

    if (!hero) {
      // Create a default hero if none exists
      hero = await Hero.create({
        title: 'Welcome to LABTIM',
        description: 'Discover our research, publications, and team members.',
        buttonContent: 'Learn More',
        imageUrl: null, // No default image
      });
      console.log('Default Hero section created.');
    }

    const heroJson = hero.toJSON();
    if (heroJson.imageUrl) {
      heroJson.imageUrl = getImageFullPath(heroJson.imageUrl);
    }

    res.status(200).json({ success: true, data: heroJson });
  } catch (error) {
    console.error('Error fetching/creating hero section:', error);
    next(error); // Pass to global error handler
  }
};

// @desc    Update the single Hero section (or create if it doesn't exist)
// @route   PUT /api/hero
// @access  Private (Admin only)
exports.updateHero = async (req, res, next) => {
  console.log('\n--- Backend (HeroController - updateHero): Request Received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file); // This should contain the new uploaded file info if any

  try {
    const { title, description, buttonContent } = req.body;
    let hero = await Hero.findOne(); // Get the single hero record

    if (!hero) {
      // If no hero exists, create one. This handles the very first save.
      if (!req.file) { // If no existing hero and no new file, it's an error
        return res.status(400).json({ success: false, message: 'An image is required to create the initial Hero section.' });
      }
      hero = await Hero.create({
        title: title || null,
        description: description || null,
        buttonContent: buttonContent || null,
        imageUrl: req.file.path,
      });
      console.log('Initial Hero section created via update endpoint.');
    } else {
      // Update existing hero
      let updateData = {
        title: title || null,
        description: description || null,
        buttonContent: buttonContent || null,
      };

      // Handle image update logic
      if (req.file) {
        // New image uploaded, delete old one if it exists
        if (hero.imageUrl) {
          const oldImagePath = path.join(__dirname, '..', hero.imageUrl); // Reconstruct full path
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old hero image:', err);
            });
          }
        }
        updateData.imageUrl = req.file.path; // Save new image path
      } else if (req.body.imageUrl === 'null') { // Frontend explicitly sent 'null' string to remove image
          if (hero.imageUrl) { // Delete old image if it exists
            const oldImagePath = path.join(__dirname, '..', hero.imageUrl);
            if (fs.existsSync(oldImagePath)) {
              fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Error deleting old hero image on explicit null:', err);
              });
            }
          }
          updateData.imageUrl = null; // Set imageUrl to null in DB
      } else {
          // If no new file and not explicitly set to null, keep existing image URL
          updateData.imageUrl = hero.imageUrl;
      }

      hero = await hero.update(updateData);
      console.log('Hero section updated.');
    }

    const heroJson = hero.toJSON();
    if (heroJson.imageUrl) {
      heroJson.imageUrl = getImageFullPath(heroJson.imageUrl);
    }
    res.status(200).json({ success: true, data: heroJson });

  } catch (error) {
    console.error('Error updating hero section:', error);
    // If an error occurs during creation/update and a new file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting new uploaded file on hero update error:', err);
      });
    }
    next(error); // Pass error to global error handler
  } finally {
    console.log('--- END Backend (HeroController - updateHero) ---');
  }
};
