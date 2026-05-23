const nodemailer = require("nodemailer");
const path = require("path");
require('dotenv').config();

// Fonctions de traduction
const getProjectTypeLabel = (type) => {
  const types = {
    web: 'Site Web / E-commerce',
    mobile: 'Application Mobile',
    saas: 'Plateforme SaaS',
    design: 'Design & UX/UI',
    spfx: 'Microsoft SPFx Solutions',
    'power-automate': 'Power Automate Workflows',
    'power-bi': 'Power BI Reporting Dashboards',
    'microsoft-project': 'Microsoft Project PMO Installation',
  };
  return types[type] || type || 'Non spécifié';
};

const getBudgetLabel = (budget) => {
  const budgets = {
    '5k-15k': '5 000 $ - 15 000 $',
    '15k-50k': '15 000 $ - 50 000 $',
    '50k+': '50 000 $ +',
  };
  return budgets[budget] || budget || 'Non spécifié';
};

const getTimelineLabel = (timeline) => {
  const timelines = {
    urgent: 'Urgent (moins d\'un mois)',
    '1-3': '1 à 3 mois',
    '5-12': '5 à 12 mois',
  };
  return timelines[timeline] || timeline || 'Non spécifié';
};

// Fonction pour générer l'email HTML administrateur
const generateAdminEmailHTML = (data) => {
  const { firstName, lastName, email, phone, company, projectType, budget, timeline, message, newsletter } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle demande de contact</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #53828a 0%, #b05f76 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          max-width: 180px;
          height: auto;
          background: white;
          border-radius: 15px;
          padding: 10px 20px;
          margin-bottom: 20px;
        }
        .header h1 { color: white; font-size: 28px; margin-bottom: 10px; }
        .content { padding: 40px 35px; }
        .section { margin-bottom: 30px; }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #53828a;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-label { font-weight: 600; color: #666; font-size: 14px; }
        .info-value { color: #1a1a1a; font-weight: 500; }
        .message-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #53828a;
        }
        .footer {
          background: #f8f9fa;
          padding: 25px 35px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p { color: #888; font-size: 13px; }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; gap: 8px; }
          .content { padding: 25px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logoNexolia" alt="NEXOLIA Consulting" class="logo" />
          <h1>📬 Nouvelle demande de contact</h1>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">📋 Informations client</div>
            <div class="info-grid">
              <div class="info-label">Nom complet :</div>
              <div class="info-value"><strong>${firstName} ${lastName}</strong></div>
              <div class="info-label">Email :</div>
              <div class="info-value">${email}</div>
              <div class="info-label">Téléphone :</div>
              <div class="info-value">${phone || '<span style="color:#999;">Non renseigné</span>'}</div>
              <div class="info-label">Entreprise :</div>
              <div class="info-value">${company || '<span style="color:#999;">Non renseignée</span>'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">🚀 Détails du projet</div>
            <div class="info-grid">
              <div class="info-label">Type de projet :</div>
              <div class="info-value"><strong>${getProjectTypeLabel(projectType)}</strong></div>
              <div class="info-label">Budget estimé :</div>
              <div class="info-value">${getBudgetLabel(budget)}</div>
              <div class="info-label">Délai souhaité :</div>
              <div class="info-value">${getTimelineLabel(timeline)}</div>
              <div class="info-label">Newsletter :</div>
              <div class="info-value">${newsletter ? '✅ Inscrit' : '❌ Non inscrit'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">📝 Description du projet</div>
            <div class="message-box">
              <p>${(message || '').replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement depuis le formulaire de contact du site NEXOLIA Consulting.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fonction pour générer l'email HTML client
const generateClientEmailHTML = (data) => {
  const { firstName, lastName, projectType, budget, timeline } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation NEXOLIA Consulting</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #53828a 0%, #b05f76 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          max-width: 160px;
          height: auto;
          background: white;
          border-radius: 12px;
          padding: 8px 16px;
          margin-bottom: 20px;
        }
        .header h1 { color: white; font-size: 26px; }
        .content { padding: 40px 35px; }
        .welcome-message { text-align: center; margin-bottom: 30px; }
        .welcome-message h2 { color: #53828a; margin-bottom: 15px; }
        .info-card {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin: 25px 0;
        }
        .info-card h3 { color: #b05f76; margin-bottom: 15px; }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-label { font-weight: 600; color: #666; }
        .info-value { color: #1a1a1a; font-weight: 500; }
        .next-steps {
          background: linear-gradient(135deg, #f0f9ff, #fff5f7);
          border-radius: 15px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .next-steps h3 { color: #53828a; margin-bottom: 15px; }
        .step-list { text-align: left; margin: 20px 0; padding-left: 20px; }
        .step-list li { margin: 10px 0; color: #555; }
        .contact-info {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          background: #f8f9fa;
          padding: 25px 35px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p { color: #888; font-size: 12px; }
        @media (max-width: 600px) {
          .content { padding: 25px; }
          .info-item { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logoNexolia" alt="NEXOLIA Consulting" class="logo" />
          <h1>✨ Merci pour votre confiance !</h1>
        </div>
        <div class="content">
          <div class="welcome-message">
            <h2>Bonjour ${firstName} ${lastName},</h2>
            <p>Nous avons bien reçu votre demande et vous remercions de l'intérêt que vous portez à <strong>NEXOLIA CONSULTING</strong>.</p>
          </div>
          <div class="info-card">
            <h3>Récapitulatif de votre demande</h3>
            <div class="info-item">
              <span class="info-label">Type de projet :</span>
              <span class="info-value"><strong>${getProjectTypeLabel(projectType)}</strong></span>
            </div>
            <div class="info-item">
              <span class="info-label">Budget estimé :</span>
              <span class="info-value">${getBudgetLabel(budget)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Délai souhaité :</span>
              <span class="info-value">${getTimelineLabel(timeline)}</span>
            </div>
          </div>
          <div class="next-steps">
            <h3>📌 Prochaines étapes</h3>
            <ul class="step-list">
              <li>✓ Notre équipe analyse votre projet dans les plus brefs délais</li>
              <li>✓ Un expert vous contactera sous <strong>24h ouvrées</strong></li>
              <li>✓ Nous organiserons un rendez-vous pour affiner vos besoins</li>
              <li>✓ Vous recevrez une proposition personnalisée</li>
            </ul>
          </div>
          <div class="contact-info">
            <p><strong>📞 Besoin d'une réponse immédiate ?</strong></p>
            <p>Notre équipe est disponible du lundi au vendredi, 8h30 à 17h00</p>
            <p>Téléphone : <strong>+216 23 267 646</strong> | <strong>+216 92 233 647</strong></p>
            <p>Email : <strong>contact@nexolia-consulting.com</strong></p>
          </div>
        </div>
        <div class="footer">
          <p><strong>NEXOLIA CONSULTING</strong> - L'innovation au service de votre réussite</p>
          <p>📍 Tunis, Ariana | Pôle Technologique El Ghazala</p>
          <p>© 2024 NEXOLIA CONSULTING - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fonction principale d'envoi d'email
const sendEmail = async (req, res) => {
  // Configurer les CORS pour permettre les requêtes du frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      projectType,
      budget,
      timeline,
      message,
      newsletter,
    } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !projectType || !message) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants",
      });
    }

    const data = { firstName, lastName, email, phone, company, projectType, budget, timeline, message, newsletter };

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER_NEXOLIA,
        pass: process.env.EMAIL_PASS_NEXOLIA,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Vérifier la connexion SMTP
    await transporter.verify();
    console.log('✅ SMTP connecté avec succès');

    // Chemin du logo - Essayez plusieurs possibilités
    let logoPath = null;
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'logoNexo.png'),
      path.join(__dirname, 'public', 'logoNexo.png'),
      path.join(__dirname, '../public', 'logoNexo.png'),
      path.join(process.cwd(), 'logoNexo.png'),
    ];

    for (const p of possiblePaths) {
      const fs = require('fs');
      if (fs.existsSync(p)) {
        logoPath = p;
        console.log(`✅ Logo trouvé : ${p}`);
        break;
      }
    }

    // Options pour l'email administrateur
    const adminMailOptions = {
      from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
      to: process.env.EMAIL_USER_NEXOLIA,
      subject: `📬 Nouvelle demande de contact - ${firstName} ${lastName}`,
      html: generateAdminEmailHTML(data),
      ...(logoPath && {
        attachments: [{
          filename: 'logoNexo.png',
          path: logoPath,
          cid: 'logoNexolia'
        }]
      })
    };

    // Options pour l'email client
    const clientMailOptions = {
      from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
      to: email,
      subject: '✨ Confirmation de votre demande - NEXOLIA Consulting',
      html: generateClientEmailHTML(data),
      ...(logoPath && {
        attachments: [{
          filename: 'logoNexo.png',
          path: logoPath,
          cid: 'logoNexolia'
        }]
      })
    };

    // Envoyer les deux emails
    await transporter.sendMail(adminMailOptions);
    console.log('✅ Email admin envoyé');
    
    await transporter.sendMail(clientMailOptions);
    console.log('✅ Email client envoyé');

    return res.status(200).json({
      success: true,
      message: 'Emails envoyés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur détaillée:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreurs lors de l\'envoi des emails',
      error: error.message
    });
  }
};

module.exports = { sendEmail };