// backend/controllers/masterSIController.js
const db = require('../models'); // Centralized db object
const MasterSI = db.MasterSI;
const User = db.User; // Ensure User model is accessible
const { Op } = require('sequelize');

// @desc    Get all Master SIs (now supports filtering by creatorId, year, type, and searchTerm)
// @route   GET /api/mastersis
// @access  Public (but can be filtered for private viewing)
exports.getAllMasterSIs = async (req, res, next) => {
  try {
    const { creatorId, year, type, searchTerm } = req.query; // Get filter parameters
    const whereClause = {};

    // Filter by creatorId if provided
    if (creatorId) {
      whereClause.userId = creatorId; // Assuming the foreign key in MasterSI model is 'userId'
    }

    // Filter by year if provided
    if (year) {
      whereClause.year = parseInt(year); // Convert year to integer
    }

    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by search term if provided (title, author, etablissement, specialite, encadrant, membres)
    if (searchTerm) {
      const lowerCaseSearchTerm = `%${searchTerm.toLowerCase()}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: lowerCaseSearchTerm } },
        { author: { [Op.like]: lowerCaseSearchTerm } },
        { etablissement: { [Op.like]: lowerCaseSearchTerm } },
        { specialite: { [Op.like]: lowerCaseSearchTerm } },
        { encadrant: { [Op.like]: lowerCaseSearchTerm } },
        // Assuming membres is stored as a stringified JSON array,
        // we can search within the string representation.
        { membres: { [Op.like]: lowerCaseSearchTerm } } 
      ];
    }

    const masterSIs = await MasterSI.findAll({
      where: whereClause, // Apply all filters
      order: [['year', 'DESC'], ['createdAt', 'DESC']], // Order by year descending, then creation date descending
      include: [{
        model: User,
        as: 'creator', // Ensure 'as' matches your association in models/index.js
        attributes: ['name', 'email']
      }]
    });

    const formattedMasterSIs = masterSIs.map(masterSI => {
      const masterSIJson = masterSI.toJSON();
      return {
        ...masterSIJson,
        creatorName: masterSI.creator ? masterSI.creator.name : null,
        creatorEmail: masterSI.creator ? masterSI.creator.email : null,
        // Ensure membres are parsed if they come as stringified JSON from the DB
        membres: typeof masterSIJson.membres === 'string' ? JSON.parse(masterSIJson.membres) : masterSIJson.membres,
        // Add creatorId to the frontend response for client-side checks
        creatorId: masterSIJson.userId // Assuming userId is the foreign key for the creator
      };
    });

    res.status(200).json({ success: true, count: formattedMasterSIs.length, data: formattedMasterSIs });
  } catch (error) {
    console.error('Error fetching Master SIs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve Master SIs', error: error.message });
  }
};

// @desc    Get single Master SI
// @route   GET /api/mastersis/:id
// @access  Public
exports.getMasterSIById = async (req, res, next) => {
  try {
    const masterSI = await MasterSI.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });
    if (!masterSI) {
      return res.status(404).json({ success: false, message: 'Master SI not found' });
    }
    const masterSIJson = masterSI.toJSON();
    const formattedMasterSI = {
      ...masterSIJson,
      creatorName: masterSI.creator ? masterSI.creator.name : null,
      creatorEmail: masterSI.creator ? masterSI.creator.email : null,
      membres: typeof masterSIJson.membres === 'string' ? JSON.parse(masterSIJson.membres) : masterSIJson.membres,
      creatorId: masterSIJson.userId // Add creatorId to the frontend response
    };
    res.status(200).json({ success: true, data: formattedMasterSI });
  } catch (error) {
    console.error('Error fetching single Master SI:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve Master SI', error: error.message });
  }
};

// @desc    Create Master SI
// @route   POST /api/mastersis
// @access  Private (Admin or Member)
exports.createMasterSI = async (req, res, next) => {
  try {
    let { title, author, year, summary, type, etablissement, specialite, encadrant, membres } = req.body;
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : null; // Get userName from the authenticated user

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID not available.' });
    }

    let parsedMembres = (typeof membres === 'string' && membres.startsWith('[')) ? JSON.parse(membres) : membres;
    if (!Array.isArray(parsedMembres)) {
      parsedMembres = [];
    }

    // FIX: Automatically set author to creator's name if author field is empty
    if (!author && userName) {
      author = userName;
    } else if (!author && !userName) {
      // If no author provided and no user name, return error
      return res.status(400).json({ success: false, message: 'Author is required and could not be automatically set.' });
    }

    const newMasterSI = await MasterSI.create({
      title,
      author, // Use the potentially modified author
      year,
      summary,
      type,
      etablissement,
      specialite,
      encadrant,
      membres: parsedMembres,
      userId, // Link the Master SI to the creating user
    });

    // Fetch the created Master SI again with creator details to send back
    const createdMasterSIWithCreator = await MasterSI.findByPk(newMasterSI.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedNewMasterSI = {
      ...createdMasterSIWithCreator.toJSON(),
      creatorName: createdMasterSIWithCreator.creator ? createdMasterSIWithCreator.creator.name : null,
      creatorEmail: createdMasterSIWithCreator.creator ? createdMasterSIWithCreator.creator.email : null,
      membres: typeof createdMasterSIWithCreator.membres === 'string' ? JSON.parse(createdMasterSIWithCreator.membres) : createdMasterSIWithCreator.membres,
      creatorId: createdMasterSIWithCreator.userId // Ensure creatorId is included
    };

    res.status(201).json({ success: true, data: formattedNewMasterSI });
  } catch (error) {
    console.error('Error creating Master SI:', error);
    res.status(400).json({ success: false, message: error.message || 'Invalid data provided.' });
  }
};

// @desc    Update Master SI
// @route   PUT /api/mastersis/:id
// @access  Private (Admin or Member for their own)
exports.updateMasterSI = async (req, res, next) => {
  try {
    let masterSI = await MasterSI.findByPk(req.params.id);
    if (!masterSI) {
      return res.status(404).json({ success: false, message: 'Master SI not found' });
    }

    // Authorization check: Only admin or the creator can update
    if (req.user.role !== 'admin' && masterSI.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this Master SI' });
    }

    if (req.body.membres && typeof req.body.membres === 'string') {
      req.body.membres = JSON.parse(req.body.membres);
    }
        
    masterSI = await masterSI.update(req.body);

    // Fetch the updated Master SI again with creator details to send back
    const updatedMasterSIWithCreator = await MasterSI.findByPk(masterSI.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedUpdatedMasterSI = {
      ...updatedMasterSIWithCreator.toJSON(),
      creatorName: updatedMasterSIWithCreator.creator ? updatedMasterSIWithCreator.creator.name : null,
      creatorEmail: updatedMasterSIWithCreator.creator ? updatedMasterSIWithCreator.creator.email : null,
      membres: typeof updatedMasterSIWithCreator.membres === 'string' ? JSON.parse(updatedMasterSIWithCreator.membres) : updatedMasterSIWithCreator.membres,
      creatorId: updatedMasterSIWithCreator.userId // Ensure creatorId is included
    };

    res.status(200).json({ success: true, data: formattedUpdatedMasterSI });
  } catch (error) {
    console.error('Error updating Master SI:', error);
    res.status(400).json({ success: false, message: error.message || 'Invalid data.' });
  }
};

// @desc    Delete Master SI
// @route   DELETE /api/mastersis/:id
// @access  Private (Admin or Member for their own)
exports.deleteMasterSI = async (req, res, next) => {
  try {
    const masterSI = await MasterSI.findByPk(req.params.id);
    if (!masterSI) {
      return res.status(404).json({ success: false, message: 'Master SI not found' });
    }

    // Authorization check: Only admin or the creator can delete
    if (req.user.role !== 'admin' && masterSI.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this Master SI' });
    }

    await masterSI.destroy();
    res.status(200).json({ success: true, message: 'Master SI deleted successfully' });
  } catch (error) {
    console.error('Error deleting Master SI:', error);
    res.status(500).json({ success: false, message: 'Failed to delete Master SI', error: error.message });
  }
};
