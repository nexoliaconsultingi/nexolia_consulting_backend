const nodemailer = require("nodemailer");

// Configuration du transporteur (à mettre dans .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envoie un email générique
 * @param {string} to - Destinataire
 * @param {string} subject - Sujet
 * @param {string} html - Corps HTML
 * @param {string} text - Corps texte brut (optionnel)
 */
const sendEmail = async (to, subject, html, text = '') => {
  const mailOptions = {
    from: `"Nexolia" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // version texte simple si non fournie
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.messageId);
  return info;
};

/**
 * Envoie un code de vérification (pour login, mot de passe oublié, etc.)
 * @param {string} email
 * @param {string} code
 * @param {string} name (optionnel)
 */
const sendVerificationCode = async (email, code, name = '') => {
  const subject = 'Votre code de vérification Nexolia';
  const html = `
    <p>Bonjour ${name ? `<b>${name}</b>` : ''},</p>
    <p>Votre code de vérification est : <b>${code}</b></p>
    <p>Ce code expire dans 3 minutes.</p>
  `;
  await sendEmail(email, subject, html);
};

/**
 * Envoie une notification à l'admin pour un nouveau devis
 * @param {Object} quote - Le devis créé
 */
const sendNewQuoteNotification = async (quote) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL non défini dans .env');
  }

  const dashboardBaseUrl = process.env.ADMIN_DASHBOARD_URL;
  const quoteLink = `${dashboardBaseUrl}`;

  const subject = `Nouveau devis de ${quote.firstName} ${quote.lastName}`;

  const html = `
    <h1>Nouvelle demande de devis</h1>
    <p><strong>Nom :</strong> ${quote.firstName} ${quote.lastName}</p>
    <p><strong>Email :</strong> ${quote.email}</p>
    <p><strong>Téléphone :</strong> ${quote.phone}</p>
    <p><strong>Type :</strong> ${quote.moveType}</p>
    <p><strong>Date de soumission :</strong> ${new Date(quote.createdAt).toLocaleString('fr-FR')}</p>
    <hr>
    <p><a href="${quoteLink}" target="_blank">Voir le devis dans le tableau de bord</a></p>
    <p>Vous pouvez répondre directement à cette demande en cliquant sur le lien.</p>
  `;

  await sendEmail(adminEmail, subject, html);
};

// Export des fonctions
module.exports = {
  sendEmail,
  sendVerificationCode,
  sendNewQuoteNotification,
};