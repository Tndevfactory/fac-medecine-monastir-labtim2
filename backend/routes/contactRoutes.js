const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../utils/emailService');

// POST /send-contact-email
router.post('/', async (req, res) => {
  console.log('Received contact form submission:', req.body);
  try {
    const { nom, prenom, email, sujet, contenu } = req.body;
    await sendContactEmail({ nom, prenom, email, sujet, contenu });
    res.json({ success: true, message: 'Message envoyé avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Erreur lors de l\'envoi du message.' });
  }
});

module.exports = router;
