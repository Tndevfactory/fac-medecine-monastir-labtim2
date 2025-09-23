// routes/eventRoutes.js


const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const db = require('../models');
const Event = db.Event;
const multer = require('multer');
const path = require('path');

// Configure multer for image upload (optional, can be extended)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/event_images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });


// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.findAll({ order: [['date', 'DESC']] });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


// POST /api/events - Create event (admin only, supports multipart/form-data)
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = '/uploads/event_images/' + req.file.filename;
    }
    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'title, description, and date are required.' });
    }
    const newEvent = await Event.create({
      title,
      description,
      date,
      location,
      image,
      category
    });
    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid data' });
  }
});


// PUT /api/events/:id - Update event (admin only, supports multipart/form-data)
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    let event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    const { title, description, date, location, category } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = '/uploads/event_images/' + req.file.filename;
    }
    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'title, description, and date are required.' });
    }
    event = await event.update({ title, description, date, location, image, category });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid data' });
  }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    await event.destroy();
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid data' });
  }
});

module.exports = router;

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.destroy();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
