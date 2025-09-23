// backend/controllers/carouselController.js
const db = require('../models'); // Centralized db object
const CarouselItem = db.CarouselItem;
const fs = require('fs');
const path = require('path');

// Helper to get the full image URL path for frontend display
const getImageFullPath = (imageFileName) => {
  if (!imageFileName) return null;
  // This path needs to be accessible from the frontend.
  // Assuming 'uploads' is served statically from the root,
  // and images are stored in 'uploads/carousel_images'.
  // Frontend will construct the URL as /uploads/carousel_images/image.jpg
  // Backend stores relative path: uploads/carousel_images/image.jpg
  return `/uploads/carousel_images/${path.basename(imageFileName)}`;
};

// @desc    Get all carousel items
// @route   GET /api/carousel
// @access  Public
exports.getAllCarouselItems = async (req, res) => {
  try {
    const items = await CarouselItem.findAll({ order: [['order', 'ASC']] });
    // For each item, ensure the imageUrl is a full path if needed for frontend display
    const formattedItems = items.map(item => {
      const itemJson = item.toJSON();
      // Only modify if imageUrl is a simple filename or relative path from upload dir
      if (itemJson.imageUrl && !itemJson.imageUrl.startsWith('http')) {
        itemJson.imageUrl = getImageFullPath(itemJson.imageUrl);
      }
      return itemJson;
    });
    res.status(200).json({ success: true, count: formattedItems.length, data: formattedItems });
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single carousel item
// @route   GET /api/carousel/:id
// @access  Public
exports.getCarouselItemById = async (req, res) => {
  try {
    const item = await CarouselItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }
    const itemJson = item.toJSON();
    if (itemJson.imageUrl && !itemJson.imageUrl.startsWith('http')) {
      itemJson.imageUrl = getImageFullPath(itemJson.imageUrl);
    }
    res.status(200).json({ success: true, data: itemJson });
  } catch (error) {
    console.error('Error fetching single carousel item:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create carousel item
// @route   POST /api/carousel
// @access  Private (Admin only)
exports.createCarouselItem = async (req, res, next) => {
  console.log('\n--- Backend (CarouselController - createCarouselItem): Request Received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file); // This should contain the uploaded file info

  try {
    const { title, description, order, link } = req.body;
    let imageUrl = null;

    if (!req.file) { // Image is mandatory for a new carousel item
        // This is the custom check to give a more specific error than notNullViolation
        return res.status(400).json({ success: false, message: 'Une image est requise pour créer un élément de carrousel.' });
    }
    imageUrl = req.file.path; // e.g., 'uploads/carousel_images/filename.jpg'

    if (!order || isNaN(Number(order))) { // Check if order is provided and is a valid number
      if (req.file) { // Clean up uploaded file if validation fails here
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file on order validation error:', err);
        });
      }
      return res.status(400).json({ success: false, message: 'L\'ordre est un champ obligatoire et doit être un nombre valide.' });
    }

    // Check if order number is unique (handled by Sequelize unique: true)
    // Adding a manual check for a more user-friendly error message.
    const existingItemWithOrder = await CarouselItem.findOne({ where: { order: Number(order) } });
    if (existingItemWithOrder) {
      // Delete the uploaded file if we're rejecting due to duplicate order
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file on duplicate order error:', err);
        });
      }
      return res.status(400).json({ success: false, message: `Un élément avec l'ordre '${order}' existe déjà. Veuillez choisir un numéro d'ordre différent.` });
    }

    const newItem = await CarouselItem.create({
      imageUrl,
      title: title || null, // Ensure empty strings are stored as null if DB allows
      description: description || null,
      order: Number(order), // Ensure order is a number
      link: link || null, // Ensure empty strings are stored as null if DB allows
    });

    // Format imageUrl for response
    const newItemJson = newItem.toJSON();
    if (newItemJson.imageUrl) { // Only format if image exists
      newItemJson.imageUrl = getImageFullPath(newItemJson.imageUrl);
    }
    res.status(201).json({ success: true, data: newItemJson });

  } catch (error) {
    console.error('Error creating carousel item:', error);
    // If an error occurs during creation and a new file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file on create error:', err);
      });
    }
    next(error); // Pass error to global error handler
  } finally {
    console.log('--- END Backend (CarouselController - createCarouselItem) ---');
  }
};

// @desc    Update carousel item
// @route   PUT /api/carousel/:id
// @access  Private (Admin only)
exports.updateCarouselItem = async (req, res, next) => {
  console.log('\n--- Backend (CarouselController - updateCarouselItem): Request Received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file); // This should contain the new uploaded file info if any

  try {
    const { title, description, order, link } = req.body;

    // --- DEBUGGING LOGS START ---
    console.log('DEBUG: Received order from req.body:', order);
    console.log('DEBUG: Type of order:', typeof order);
    console.log('DEBUG: Value of Number(order):', Number(order));
    console.log('DEBUG: Result of isNaN(Number(order)):', isNaN(Number(order)));
    console.log('DEBUG: Result of order === undefined:', order === undefined);
    console.log('DEBUG: Result of order === null:', order === null);
    console.log('DEBUG: Combined validation check (order === undefined || order === null || isNaN(Number(order))):',
      order === undefined || order === null || isNaN(Number(order))
    );
    // --- DEBUGGING LOGS END ---

    let item = await CarouselItem.findByPk(req.params.id);

    if (!item) {
      // If no item found and a file was uploaded, delete the orphaned file
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting orphaned file:', err);
        });
      }
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }

    // Validate order on update
    // This check is still valid for individual item updates where order might be changed manually.
    if (order === undefined || order === null || isNaN(Number(order))) {
        if (req.file) { fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting uploaded file on update order validation error:', err); }); }
        return res.status(400).json({ success: false, message: 'L\'ordre est un champ obligatoire et doit être un nombre valide.' });
    }

    // Handle order uniqueness on update: allow if it's the same item, or if different and unique
    if (Number(order) !== item.order) { // Only check uniqueness if order is actually changing
      const existingItemWithNewOrder = await CarouselItem.findOne({ where: { order: Number(order) } });
      if (existingItemWithNewOrder && existingItemWithNewOrder.id !== item.id) {
        if (req.file) { // Delete new uploaded file if order is duplicate for another item
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file on duplicate order update error:', err);
          });
        }
        return res.status(400).json({ success: false, message: `Un élément avec l'ordre '${order}' existe déjà. Veuillez choisir un numéro d'ordre différent.` });
      }
    }

    let updateData = {
      title: title || null,
      description: description || null,
      order: Number(order),
      link: link || null,
    };

    // Handle image update logic
    if (req.file) {
      // New image uploaded, delete old one if it exists
      if (item.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', item.imageUrl); // Reconstruct full path
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old carousel image:', err);
          });
        }
      }
      updateData.imageUrl = req.file.path; // Save new image path
    } else if (req.body.imageUrl === 'null') { // Frontend explicitly sent 'null' string to remove image
        if (item.imageUrl) { // Delete old image if it exists
          const oldImagePath = path.join(__dirname, '..', item.imageUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old carousel image on explicit null:', err);
            });
          }
        }
        updateData.imageUrl = null; // Set imageUrl to null in DB
    } else {
        // If no new file and not explicitly set to null, keep existing image URL
        updateData.imageUrl = item.imageUrl;
    }


    item = await item.update(updateData);

    // Format imageUrl for response
    const updatedItemJson = item.toJSON();
    if (updatedItemJson.imageUrl) {
      updatedItemJson.imageUrl = getImageFullPath(updatedItemJson.imageUrl);
    }
    res.status(200).json({ success: true, data: updatedItemJson });

  } catch (error) {
    console.error('Error updating carousel item:', error);
    // If an error occurs during update and a new file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting new uploaded file on update error:', err);
      });
    }
    next(error); // Pass error to global error handler
  } finally {
    console.log('--- END Backend (CarouselController - updateCarouselItem) ---');
  }
};

// @desc    Delete carousel item
// @route   DELETE /api/carousel/:id
// @access  Private (Admin only)
exports.deleteCarouselItem = async (req, res, next) => {
  console.log('\n--- Backend (CarouselController - deleteCarouselItem): Request Received ---');
  console.log('req.params.id:', req.params.id);

  try {
    const item = await CarouselItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }

    // Delete associated image file from server if it exists
    if (item.imageUrl) {
      const imagePath = path.join(__dirname, '..', item.imageUrl); // Reconstruct full path
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting carousel image on item delete:', err);
        });
      }
    }

    await item.destroy();
    res.status(200).json({ success: true, message: 'Carousel item deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    next(error); // Pass error to global error handler
  } finally {
    console.log('--- END Backend (CarouselController - deleteCarouselItem) ---');
  }
};

// @desc    Reorder multiple carousel items in a batch
// @route   PUT /api/carousel/reorder
// @access  Private (Admin only)
exports.reorderCarouselItems = async (req, res, next) => {
  console.log('\n--- Backend (CarouselController - reorderCarouselItems): Request Received ---');
  console.log('req.body:', JSON.stringify(req.body, null, 2)); // Log the entire request body for inspection

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.some(item => !item.id || typeof item.order !== 'number')) {
      console.error('Reorder Error: Invalid request body. Expected an array of items with id (string) and order (number). Received:', items);
      return res.status(400).json({ success: false, message: 'Invalid request body. Expected an array of items with id and order.' });
    }

    // Extract and log the IDs received from the frontend
    const receivedIds = items.map(item => item.id);
    console.log('Reorder: IDs received from frontend:', receivedIds);

    // Start a Sequelize transaction to ensure atomicity
    const transaction = await db.sequelize.transaction();

    try {
      // Step 1: Temporarily set the 'order' of all affected items to a unique, non-conflicting value (e.g., a very large number or null if column allows)
      // This frees up the existing order numbers.
      console.log('Reorder: Temporarily clearing/setting orders to avoid unique constraint conflicts...');
      const itemIdsToUpdate = items.map(item => item.id);
      // Find existing items to get their current orders
      const existingCarouselItems = await CarouselItem.findAll({
        where: { id: itemIdsToUpdate },
        transaction: transaction,
      });

      if (existingCarouselItems.length !== itemIdsToUpdate.length) {
        await transaction.rollback();
        console.error('Reorder Error: Not all items found for reordering. Some IDs might be invalid.');
        return res.status(404).json({ success: false, message: 'One or more carousel items not found for reordering.' });
      }

      // Set current orders to a temporary high value to avoid conflicts
      // Use a value higher than any possible current or future order
      const TEMP_ORDER_OFFSET = 1000000; // A large offset to ensure uniqueness
      for (const item of existingCarouselItems) {
        await CarouselItem.update(
          { order: item.order + TEMP_ORDER_OFFSET }, // Add offset to make it unique
          { where: { id: item.id }, transaction: transaction }
        );
      }
      console.log('Reorder: Temporary orders set.');


      // Step 2: Update each item with its new, correct order.
      // Now that old order values are "free", this step should succeed.
      console.log('Reorder: Updating items with new, final orders within transaction:');
      for (const item of items) {
        console.log(`  Updating ID: ${item.id} to new order: ${item.order}`);
        const [affectedRows] = await CarouselItem.update(
          { order: item.order },
          { where: { id: item.id }, transaction: transaction }
        );
        if (affectedRows === 0) {
          // This case should ideally not happen if Step 1 found all items
          await transaction.rollback();
          console.error(`Reorder Error: Item with ID ${item.id} not found for final update during reordering.`);
          return res.status(404).json({ success: false, message: `Failed to update carousel order: Carousel item not found for ID: ${item.id} during final update.` });
        }
      }

      // Commit the transaction if all updates are successful
      await transaction.commit();
      console.log('Reorder: Transaction committed successfully.');

      res.status(200).json({ success: true, message: 'Carousel order updated successfully.' });
    } catch (transactionError) {
      // Rollback the transaction if any error occurs
      await transaction.rollback();
      console.error('Reorder Error: Transaction rolled back. Details:', transactionError);

      // This is the crucial part: if a unique constraint error happens *here*,
      // it means the frontend somehow sent non-unique orders, or there's a race condition.
      if (transactionError.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'Erreur de contrainte unique lors de la réorganisation. Assurez-vous que tous les ordres sont distincts et qu\'il n\'y a pas de conflits.' });
      }
      next(transactionError); // Pass other errors to global error handler
    }

  } catch (error) {
    console.error('Reorder Error: Processing reorder request failed. Details:', error);
    next(error); // Pass error to global error handler
  } finally {
    console.log('--- END Backend (CarouselController - reorderCarouselItems) ---');
  }
};
