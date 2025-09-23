// backend/controllers/publicationController.js
const db = require('../models');
const Publication = db.Publication;
const User = db.User;
const { Op } = require('sequelize');

// @desc    Get all publications (now supports filtering by creatorId, year, and searchTerm)
// @route   GET /api/publications
// @access  Public (but can be filtered)
exports.getAllPublications = async (req, res, next) => {
  try {
    const { creatorId, year, searchTerm } = req.query; // Get creatorId, year, and searchTerm from query parameters
    const whereClause = {};

    // Filter by creatorId if provided
    if (creatorId) {
      whereClause.userId = creatorId; // Assuming the foreign key in Publication model is 'userId'
    }

    // Filter by year if provided
    if (year) {
      whereClause.year = parseInt(year); // Convert year to integer
    }

    // Filter by search term if provided (title or authors)
    if (searchTerm) {
      const lowerCaseSearchTerm = `%${searchTerm.toLowerCase()}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: lowerCaseSearchTerm } },
        // Assuming authors is stored as a stringified JSON array,
        // we can search within the string representation.
        // This might require a text-based search or a more advanced full-text search solution
        // for optimal performance on large datasets.
        { authors: { [Op.like]: lowerCaseSearchTerm } } 
      ];
    }

    const publications = await Publication.findAll({
      where: whereClause, // Apply all filters
      order: [['year', 'DESC'], ['createdAt', 'DESC']], // Order by year descending, then creation date descending
      include: [{
        model: User,
        as: 'creator', // Ensure 'as' matches your association in models/index.js
        attributes: ['name', 'email']
      }]
    });

    const formattedPublications = publications.map(pub => {
      const pubJson = pub.toJSON();
      return {
        ...pubJson,
        creatorName: pub.creator ? pub.creator.name : null,
        creatorEmail: pub.creator ? pub.creator.email : null,
        // Ensure authors are parsed if they come as stringified JSON from the DB
        authors: typeof pubJson.authors === 'string' ? JSON.parse(pubJson.authors) : pubJson.authors,
        // Add creatorId to the frontend response for client-side checks
        creatorId: pubJson.userId // Assuming userId is the foreign key for the creator
      };
    });

    res.status(200).json({ success: true, count: formattedPublications.length, data: formattedPublications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve publications', error: error.message });
  }
};

// @desc    Get single publication
// @route   GET /api/publications/:id
// @access  Public
exports.getPublicationById = async (req, res, next) => {
  try {
    const publication = await Publication.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });
    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    const pubJson = publication.toJSON();
    const formattedPublication = {
      ...pubJson,
      creatorName: publication.creator ? publication.creator.name : null,
      creatorEmail: publication.creator ? publication.creator.email : null,
      authors: typeof pubJson.authors === 'string' ? JSON.parse(pubJson.authors) : pubJson.authors,
      creatorId: pubJson.userId // Add creatorId to the frontend response
    };
    res.status(200).json({ success: true, data: formattedPublication });
  } catch (error) {
    console.error('Error fetching single publication:', error);
    next(error);
  }
};

// @desc    Create publication
// @route   POST /api/publications
// @access  Private (Admin or Member)
exports.createPublication = async (req, res, next) => {
  try {
    let { title, authors, year, journal, volume, pages, doi } = req.body;
    const userId = req.user ? req.user.id : null; // Get userId from the authenticated user
    const userName = req.user ? req.user.name : null; // Get userName from the authenticated user

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID not available.' });
    }

    let parsedAuthors = (typeof authors === 'string' && authors.startsWith('[')) ? JSON.parse(authors) : authors;
    
    // Ensure authors is an array
    if (!Array.isArray(parsedAuthors)) {
      parsedAuthors = [];
    }

    // FIX: Automatically add creator's name if not already present
    if (userName && !parsedAuthors.includes(userName)) {
      parsedAuthors.unshift(userName); // Prepend creator's name
    }

    const newPublication = await Publication.create({
      title,
      authors: parsedAuthors, // Use the potentially modified authors array
      year,
      journal,
      volume,
      pages,
      doi,
      userId, // Associate publication with the creator's userId
    });

    if (userId && User.extendExpiration) {
      await User.extendExpiration(userId);
    }

    // Fetch the created publication again with creator details to send back
    const createdPublicationWithCreator = await Publication.findByPk(newPublication.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedNewPublication = {
      ...createdPublicationWithCreator.toJSON(),
      creatorName: createdPublicationWithCreator.creator ? createdPublicationWithCreator.creator.name : null,
      creatorEmail: createdPublicationWithCreator.creator ? createdPublicationWithCreator.creator.email : null,
      authors: typeof createdPublicationWithCreator.authors === 'string' ? JSON.parse(createdPublicationWithCreator.authors) : createdPublicationWithCreator.authors,
      creatorId: createdPublicationWithCreator.userId // Ensure creatorId is included
    };

    res.status(201).json({ success: true, data: formattedNewPublication });
  } catch (error) {
    console.error('Error creating publication:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'DOI must be unique.' });
    }
    next(error);
  }
};

// @desc    Update publication
// @route   PUT /api/publications/:id
// @access  Private (Admin or Member for their own)
exports.updatePublication = async (req, res, next) => {
  try {
    let publication = await Publication.findByPk(req.params.id);
    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }

    // Authorization check: Only admin or the creator can update
    if (req.user.role !== 'admin' && publication.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this publication' });
    }

    // Parse authors if they come as a string (from FormData or JSON stringified)
    if (req.body.authors && typeof req.body.authors === 'string') {
      req.body.authors = JSON.parse(req.body.authors);
    }
        
    publication = await publication.update(req.body);

    // Fetch the updated publication again with creator details to send back
    const updatedPublicationWithCreator = await Publication.findByPk(publication.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    const formattedUpdatedPublication = {
      ...updatedPublicationWithCreator.toJSON(),
      creatorName: updatedPublicationWithCreator.creator ? updatedPublicationWithCreator.creator.name : null,
      creatorEmail: updatedPublicationWithCreator.creator ? updatedPublicationWithCreator.creator.email : null,
      authors: typeof updatedPublicationWithCreator.authors === 'string' ? JSON.parse(updatedPublicationWithCreator.authors) : updatedPublicationWithCreator.authors,
      creatorId: updatedPublicationWithCreator.userId // Ensure creatorId is included
    };

    res.status(200).json({ success: true, data: formattedUpdatedPublication });
  } catch (error) {
    console.error('Error updating publication:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'DOI must be unique.' });
    }
    next(error);
  }
};

// @desc    Delete publication
// @route   DELETE /api/publications/:id
// @access  Private (Admin or Member for their own)
exports.deletePublication = async (req, res, next) => {
  try {
    const publication = await Publication.findByPk(req.params.id);
    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }

    // Authorization check: Only admin or the creator can delete
    if (req.user.role !== 'admin' && publication.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this publication' });
    }

    await publication.destroy();
    res.status(200).json({ success: true, message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    next(error);
  }
};
