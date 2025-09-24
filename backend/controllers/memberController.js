// controllers/memberController.js
const Member = require('../models/Member'); // Import the Member model
const User = require('../models/User'); // Import User model to optionally link to members

// @desc    Get all members
// @route   GET /api/members
// @access  Private/Admin
const getAllMembers = async (req, res) => {
  try {
    // Find all members in the database
    // You might want to include pagination or filters later
    const members = await Member.findAll();

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, message: 'Server error fetching members' });
  }
};

// @desc    Get single member by ID
// @route   GET /api/members/:id
// @access  Public (or Private/Admin if member profiles should be hidden)
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching member' });
  }
};

// @desc    Create a new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res) => {
  const { 
    name, 
    position, 
    email, 
    phone, 
    image, 
    orcid, 
    biography, 
    expertises, 
    researchInterests, 
    universityEducation,
    userId // Optional: link to an existing User ID
  } = req.body;

  try {
    // Optional: Check if the provided userId exists and is valid
    if (userId) {
      const existingUser = await User.findByPk(userId);
      if (!existingUser) {
        return res.status(400).json({ success: false, message: 'Provided userId does not exist' });
      }
    }

    const member = await Member.create({
      name,
      position,
      email,
      phone,
      image,
      orcid,
      biography,
      expertises,        // These will be JSON-stringified by the model's setter
      researchInterests, // if they are arrays in the request body
      universityEducation,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member,
    });
  } catch (error) {
    console.error('Error creating member:', error);
    // Handle specific Sequelize errors if needed, e.g., unique constraint violation for ORCID/email
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A member with this ORCID or email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error creating member' });
  }
};


module.exports = {
  getAllMembers,
  getMemberById,
  createMember, // Export the new function
};
