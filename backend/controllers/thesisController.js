// backend/controllers/thesisController.js
const db = require('../models'); // Centralized db object
const Thesis = db.Thesis;
const User = db.User; // Ensure User model is accessible
const { Op } = require('sequelize');

// @desc    Get all theses (now supports filtering by creatorId, year, type, and searchTerm)
// @route   GET /api/theses
// @access  Public (but can be filtered for private viewing)
exports.getAllTheses = async (req, res, next) => {
  try {
    const { creatorId, year, type, searchTerm } = req.query; // Get filter parameters
    const whereClause = {};

    // Filter by creatorId if provided
    if (creatorId) {
      whereClause.userId = creatorId; // Assuming the foreign key in Thesis model is 'userId'
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

    const theses = await Thesis.findAll({
      where: whereClause, // Apply all filters
      order: [['year', 'DESC'], ['createdAt', 'DESC']], // Order by year descending, then creation date descending
      include: [{
        model: User,
        as: 'creator', // Ensure 'as' matches your association in models/index.js
        attributes: ['name', 'email']
      }]
    });

    const formattedTheses = theses.map(thesis => {
      const thesisJson = thesis.toJSON();
      return {
        ...thesisJson,
        creatorName: thesis.creator ? thesis.creator.name : null,
        creatorEmail: thesis.creator ? thesis.creator.email : null,
        // Ensure membres are parsed if they come as stringified JSON from the DB
        membres: typeof thesisJson.membres === 'string' ? JSON.parse(thesisJson.membres) : thesisJson.membres,
        // Add creatorId to the frontend response for client-side checks
        creatorId: thesisJson.userId // Assuming userId is the foreign key for the creator
      };
    });

    res.status(200).json({ success: true, count: formattedTheses.length, data: formattedTheses });
  } catch (error) {
    console.error('Error fetching theses:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve theses', error: error.message });
  }
};

// @desc    Get single thesis
// @route   GET /api/theses/:id
// @access  Public
exports.getThesisById = async (req, res, next) => {
  try {
    const thesis = await Thesis.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });
    if (!thesis) {
      return res.status(404).json({ success: false, message: 'Thesis not found' });
    }
    const thesisJson = thesis.toJSON();
    const formattedThesis = {
      ...thesisJson,
      creatorName: thesis.creator ? thesis.creator.name : null,
      creatorEmail: thesis.creator ? thesis.creator.email : null,
      membres: typeof thesisJson.membres === 'string' ? JSON.parse(thesisJson.membres) : thesisJson.membres,
      creatorId: thesisJson.userId // Add creatorId to the frontend response
    };
    res.status(200).json({ success: true, data: formattedThesis });
  } catch (error) {
    console.error('Error fetching single thesis:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve thesis', error: error.message });
  }
};

// @desc    Create thesis
// @route   POST /api/theses
// @access  Private (Admin or Member)
exports.createThesis = async (req, res, next) => {
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

    const newThesis = await Thesis.create({
      title,
      author, // Use the potentially modified author
      year,
      summary,
      type,
      etablissement,
      specialite,
      encadrant,
      membres: parsedMembres,
      userId, // Link the thesis to the creating user
    });

    // Fetch the created thesis again with creator details to send back
    const createdThesisWithCreator = await Thesis.findByPk(newThesis.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedNewThesis = {
      ...createdThesisWithCreator.toJSON(),
      creatorName: createdThesisWithCreator.creator ? createdThesisWithCreator.creator.name : null,
      creatorEmail: createdThesisWithCreator.creator ? createdThesisWithCreator.creator.email : null,
      membres: typeof createdThesisWithCreator.membres === 'string' ? JSON.parse(createdThesisWithCreator.membres) : createdThesisWithCreator.membres,
      creatorId: createdThesisWithCreator.userId // Ensure creatorId is included
    };

    res.status(201).json({ success: true, data: formattedNewThesis });
  } catch (error) {
    console.error('Error creating thesis:', error);
    res.status(400).json({ success: false, message: error.message || 'Invalid data provided.' });
  }
};

// @desc    Update thesis
// @route   PUT /api/theses/:id
// @access  Private (Admin or Member for their own)
exports.updateThesis = async (req, res, next) => {
  try {
    let thesis = await Thesis.findByPk(req.params.id);
    if (!thesis) {
      return res.status(404).json({ success: false, message: 'Thesis not found' });
    }

    // Authorization check: Only admin or the creator can update
    if (req.user.role !== 'admin' && thesis.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this thesis' });
    }

    if (req.body.membres && typeof req.body.membres === 'string') {
      req.body.membres = JSON.parse(req.body.membres);
    }
        
    thesis = await thesis.update(req.body);

    // Fetch the updated thesis again with creator details to send back
    const updatedThesisWithCreator = await Thesis.findByPk(thesis.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedUpdatedThesis = {
      ...updatedThesisWithCreator.toJSON(),
      creatorName: updatedThesisWithCreator.creator ? updatedThesisWithCreator.creator.name : null,
      creatorEmail: updatedThesisWithCreator.creator ? updatedThesisWithCreator.creator.email : null,
      membres: typeof updatedThesisWithCreator.membres === 'string' ? JSON.parse(updatedThesisWithCreator.membres) : updatedThesisWithCreator.membres,
      creatorId: updatedThesisWithCreator.userId // Ensure creatorId is included
    };

    res.status(200).json({ success: true, data: formattedUpdatedThesis });
  } catch (error) {
    console.error('Error updating thesis:', error);
    res.status(400).json({ success: false, message: error.message || 'Invalid data.' });
  }
};

// @desc    Delete thesis
// @route   DELETE /api/theses/:id
// @access  Private (Admin or Member for their own)
exports.deleteThesis = async (req, res, next) => {
  try {
    const thesis = await Thesis.findByPk(req.params.id);
    if (!thesis) {
      return res.status(404).json({ success: false, message: 'Thesis not found' });
    }

    // Authorization check: Only admin or the creator can delete
    if (req.user.role !== 'admin' && thesis.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this thesis' });
    }

    await thesis.destroy();
    res.status(200).json({ success: true, message: 'Thesis deleted successfully' });
  } catch (error) {
    console.error('Error deleting thesis:', error);
    res.status(500).json({ success: false, message: 'Failed to delete thesis', error: error.message });
  }
};
