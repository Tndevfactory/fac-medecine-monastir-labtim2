/**
 * Sends a contact form email to contact@ct-iama.org
 * @param {Object} param0
 * @param {string} param0.nom
 * @param {string} param0.prenom
 * @param {string} param0.email
 * @param {string} param0.sujet
 * @param {string} param0.contenu
 */
const sendContactEmail = async ({ nom, prenom, email, sujet, contenu }) => {
  console.log('Preparing to send email to contact@ct-iama.org with:', { nom, prenom, email, sujet, contenu });
  const mailOptions = {
    from: `LABTIM Contact Form <${process.env.EMAIL_USER}>`,
    to: 'contact@ct-iama.org',
    subject: `Nouveau message de contact: ${sujet}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Nouveau message de contact</h1>
        </div>
        <div style="padding: 20px;">
          <p><strong>Nom:</strong> ${nom}</p>
          <p><strong>Prénom:</strong> ${prenom}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Sujet:</strong> ${sujet}</p>
          <p><strong>Message:</strong></p>
          <p style="background-color: #f4f4f4; padding: 15px; border-left: 5px solid #0056b3; margin: 20px 0; font-size: 16px;">${contenu}</p>
        </div>
        <div style="background-color: #f8f8f8; color: #666; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #eee;">
          Ceci est un email automatique envoyé depuis le formulaire de contact du site LABTIM.
        </div>
      </div>
    `,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Contact email sent successfully.' };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new Error(`Failed to send contact email: ${error.message}`);
  }
};
// backend/utils/emailService.js
require('dotenv').config(); // Ensure environment variables are loaded

const nodemailer = require('nodemailer');
// Optional: For OAuth2 with Gmail (uncomment and configure if you switch to OAuth2)
// const { google } = require('googleapis');

// --- Nodemailer Transporter Setup ---
// This configuration uses direct SMTP with App Password for Gmail.
// For production, consider using OAuth2 or a dedicated email service (SendGrid, Mailgun, AWS SES).
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password (recommended) or regular password (less secure)
  },
});

/**
 * Sends an email with user credentials.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} userName - The name of the new user.
 * @param {string} userEmail - The new user's login email.
 * @param {string} temporaryPassword - The temporary password for the user.
 */
const sendCredentialsEmail = async (toEmail, userName, userEmail, temporaryPassword) => {
  const mailOptions = {
    from: `"LABTIM Admin" <${process.env.EMAIL_USER}>`, // Sender address
    to: toEmail, // Recipient address
    subject: 'Vos identifiants de connexion temporaires pour LABTIM', // Subject line
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Bienvenue chez LABTIM !</h1>
        </div>
        <div style="padding: 20px;">
          <p>Bonjour ${userName || userEmail},</p>
          <p>L'administrateur de LABTIM vous a ajouté en tant que membre.</p>
          <p>Voici vos identifiants de connexion temporaires :</p>
          <p style="background-color: #f4f4f4; padding: 15px; border-left: 5px solid #0056b3; margin: 20px 0; font-size: 16px;">
            <strong>Email :</strong> ${userEmail}<br/>
            <strong>Mot de passe temporaire :</strong> ${temporaryPassword}
          </p>
          <p>Pour des raisons de sécurité, nous vous demandons de bien vouloir modifier votre mot de passe dès votre première connexion.</p>
          <p>Vous pouvez vous connecter en utilisant le lien ci-dessous :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/connexion" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Se connecter à LABTIM
            </a>
          </p>
          <p>Si vous avez des questions, n'hésitez pas à contacter l'administrateur.</p>
          <p>Cordialement,<br/>L'équipe LABTIM</p>
        </div>
        <div style="background-color: #f8f8f8; color: #666; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #eee;">
          Ceci est un email automatique, veuillez ne pas y répondre.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent: %s', info.messageId); // Removed console.log
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};


/**
 * Sends a password reset email.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} userName - The name of the user (or email if name not available).
 * @param {string} resetUrl - The full URL for the password reset.
 */
const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const mailOptions = {
    from: `"LABTIM Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe LABTIM',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Réinitialisation du mot de passe</h1>
        </div>
        <div style="padding: 20px;">
          <p>Bonjour ${userName || toEmail},</p>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte LABTIM.</p>
          <p>Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ce lien de réinitialisation est valide pour **1 heure**.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail. Votre mot de passe actuel ne sera pas modifié.</p>
          <p>Cordialement,<br/>L'équipe LABTIM</p>
        </div>
        <div style="background-color: #f8f8f8; color: #666; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #eee;">
          Ceci est un email automatique, veuillez ne pas y répondre.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log('Password reset email sent: %s', info.messageId); // Removed console.log
    return { success: true, message: 'Password reset email sent successfully.' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};


module.exports = {
  sendCredentialsEmail,
  sendPasswordResetEmail,
  sendContactEmail,
};
