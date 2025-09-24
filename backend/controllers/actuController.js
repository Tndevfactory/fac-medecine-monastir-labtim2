// backend/controllers/actuController.js


const db = require('../models');
const Actu = db.Actu;
const User = db.User;
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

console.log('--- DEBUG: ACTU CONTROLLER LOADED (V2) ---'); // <-- NEW, VERY IMPORTANT VERIFICATION LOG
console.log('--- DEBUG: ACTU CONTROLLER LOADED (V2) ---'); // <-- NEW, VERY IMPORTANT VERIFICATION LOG
console.log('--- DEBUG: ACTU CONTROLLER LOADED (V2) ---'); // <-- NEW, VERY IMPORTANT VERIFICATION LOG

// Controller function to get all actus
exports.getAllActus = async (req, res) => {
  try {
    const { category, searchTerm } = req.query; // Get category and searchTerm from query parameters

    console.log('\n--- DEBUG: getAllActus - Received Query Parameters ---');
    console.log('Category:', category);
    console.log('Search Term:', searchTerm);
    console.log('-----------------------------------------------------\n');

    const whereClause = {};

    // Filter by category if provided and not an empty string
    if (category && category !== '') {
      whereClause.category = category;
    }

    // Filter by search term if provided and not an empty string
    if (searchTerm && searchTerm !== '') {
      const lowerCaseSearchTerm = `%${searchTerm.toLowerCase()}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: lowerCaseSearchTerm } },
        { shortDescription: { [Op.like]: lowerCaseSearchTerm } }
      ];
    }

    console.log('\n--- DEBUG: getAllActus - Constructed whereClause ---');
    console.log(whereClause);
    console.log('-----------------------------------------------------\n');

    const actus = await Actu.findAll({
      where: whereClause, // Apply filters
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedActus = actus.map(actu => ({
      id: actu.id,
      title: actu.title,
      image: actu.image,
      date: actu.date,
      category: actu.category,
      shortDescription: actu.shortDescription,
      fullContent: actu.fullContent,
      userId: actu.userId,
      creatorName: actu.creator ? actu.creator.name : null,
      createdAt: actu.createdAt,
      updatedAt: actu.updatedAt,
    }));

    res.status(200).json({ success: true, count: formattedActus.length, data: formattedActus });
  } catch (error) {
    console.error('Error fetching actus:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve actus', error: error.message });
  }
};

// Controller function to get a single actu by ID
exports.getActuById = async (req, res) => {
  try {
    const actu = await Actu.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name'],
          required: false
        }
      ]
    });

    if (!actu) {
      return res.status(404).json({ success: false, message: 'Actu not found' });
    }

    const formattedActu = {
      id: actu.id,
      title: actu.title,
      image: actu.image,
      date: actu.date,
      category: actu.category,
      shortDescription: actu.shortDescription,
      fullContent: actu.fullContent,
      userId: actu.userId,
      creatorName: actu.creator ? actu.creator.name : null,
      createdAt: actu.createdAt,
      updatedAt: actu.updatedAt,
    };

    res.status(200).json({ success: true, data: formattedActu });
  } catch (error) {
    console.error('Error fetching actu by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve actu', error: error.message });
  }
};

// @desc    Create new actu
// @route   POST /api/actus
// @access  Private (Admin only)
exports.createActu = async (req, res, next) => {
  console.log('\n--- Backend (POST /api/actus): Request received ---');
  console.log('req.body (after Multer):', req.body); 
  console.log('req.file (after Multer):', req.file);

  try {
    const actuData = {
      title: req.body.title || '', 
      date: req.body.date || new Date().toISOString().split('T')[0], 
      category: req.body.category || 'Conférence',
      shortDescription: req.body.shortDescription || '', 
      fullContent: req.body.fullContent || '', 
      userId: req.user.id, 
    };

    if (req.file) {
      actuData.image = `/uploads/actu_images/${req.file.filename}`;
    } else if (req.body.image === '') {
      actuData.image = null;
    } else {
      actuData.image = null;
    }

    console.log('\n--- Backend: Actu data prepared for creation ---');
    console.log(actuData);
    console.log('---------------------------------------------------\n');

    const actu = await Actu.create(actuData);

    const createdActuWithCreator = await Actu.findByPk(actu.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedNewActu = {
      ...createdActuWithCreator.toJSON(),
      creatorName: createdActuWithCreator.creator ? createdActuWithCreator.creator.name : null,
      userId: createdActuWithCreator.userId
    };

    res.status(201).json({ success: true, data: formattedNewActu });
  } catch (error) {
    console.error('Error creating actu:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file on creation error:', err);
      });
    }
    next(error);
  }
};

// @desc    Update actu
// @route   PUT /api/actus/:id
// @access  Private (Admin only)
exports.updateActu = async (req, res, next) => {
  console.log('\n--- Backend (PUT /api/actus/:id): Request received ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  try {
    const { id } = req.params;
    let actu = await Actu.findByPk(id);

    if (!actu) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file for not found actu:', err);
        });
      }
      return res.status(404).json({ success: false, message: 'Actu not found' });
    }

    const updateData = {
        title: req.body.title || actu.title, 
        date: req.body.date || actu.date,
        category: req.body.category || actu.category,
        shortDescription: req.body.shortDescription || actu.shortDescription,
        fullContent: req.body.fullContent || actu.fullContent, 
        userId: req.user.id,
    };

    if (req.file) {
      if (actu.image) { 
        const oldImagePath = path.join(__dirname, '..', actu.image); 
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old actu image:', err);
          });
        }
      }
      updateData.image = `/uploads/actu_images/${req.file.filename}`;
    } else if (req.body.image === '') {
        if (actu.image) { 
            const oldImagePath = path.join(__dirname, '..', actu.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Error deleting old actu image on clear:', err);
                });
            }
        }
        updateData.image = null;
    } else {
        updateData.image = actu.image;
    }

    console.log('\n--- Backend: Actu data prepared for update ---');
    console.log(updateData);
    console.log('---------------------------------------------------\n');

    actu = await actu.update(updateData);

    const updatedActuWithCreator = await Actu.findByPk(actu.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedUpdatedActu = {
      ...updatedActuWithCreator.toJSON(),
      creatorName: updatedActuWithCreator.creator ? updatedActuWithCreator.creator.name : null,
      userId: updatedActuWithCreator.userId
    };

    res.status(200).json({ success: true, data: formattedUpdatedActu });
  } catch (error) {
    console.error('Error updating actu:', error);
    if (req.file) { 
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting new uploaded file on update error:', err);
      });
    }
    next(error);
  }
};

// @desc    Delete actu
// @route   DELETE /api/actus/:id
// @access  Private (Admin only)
exports.deleteActu = async (req, res, next) => {
  try {
    const actu = await Actu.findByPk(req.params.id);
    if (!actu) {
      return res.status(404).json({ success: false, message: 'Actu not found' });
    }

    if (actu.image) {
      const imageFileName = path.basename(actu.image);
      const imagePath = path.join(__dirname, '../uploads/actu_images', imageFileName);
      
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting actu image on delete:', err);
        });
      }
    }

    await actu.destroy();
    res.status(200).json({ success: true, message: 'Actualité supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting actu:', error);
    next(error);
  }
};
