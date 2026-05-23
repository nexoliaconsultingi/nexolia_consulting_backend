const nodemailer = require("nodemailer");
const path = require("path");

// Fonctions de traduction (identiques à Next.js)
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

const sendEmail = async (req, res) => {
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

        // Configuration du transporteur email
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true, // true si port 465
            auth: {
                user: process.env.EMAIL_USER_NEXOLIA,
                pass: process.env.EMAIL_PASS_NEXOLIA,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Vérification de la configuration SMTP
        await transporter.verify();

        // Template email administrateur (version complète avec logo)
        const adminMailOptions = {
            from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
            to: process.env.EMAIL_USER_NEXOLIA,
            subject: `📬 Nouvelle demande de contact - ${firstName} ${lastName}`,
            html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle demande de contact</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
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
              position: relative;
            }
            
            .logo-container {
              margin-bottom: 20px;
            }
            
            .logo {
              max-width: 180px;
              height: auto;
              background: white;
              border-radius: 15px;
              padding: 10px 20px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .header h1 {
              color: white;
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            
            .header p {
              color: rgba(255, 255, 255, 0.95);
              font-size: 16px;
            }
            
            .badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              margin-top: 15px;
            }
            
            .content {
              padding: 40px 35px;
            }
            
            .section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #53828a;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e0e0e0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 2fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .info-label {
              font-weight: 600;
              color: #666;
              font-size: 14px;
            }
            
            .info-value {
              color: #1a1a1a;
              font-weight: 500;
            }
            
            .message-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #53828a;
              margin-top: 10px;
            }
            
            .message-box p {
              margin: 0;
              color: #444;
              line-height: 1.8;
            }
            
            .priority-tag {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              background: #fee;
              color: #c00;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 25px 35px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            
            .footer p {
              color: #888;
              font-size: 13px;
              margin: 5px 0;
            }
            
            .social-links {
              margin-top: 15px;
            }
            
            .social-links a {
              color: #53828a;
              text-decoration: none;
              margin: 0 10px;
              font-size: 12px;
            }
            
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #53828a, #b05f76);
              color: white;
              padding: 12px 30px;
              border-radius: 25px;
              text-decoration: none;
              margin-top: 20px;
              font-weight: 600;
            }
            
            @media (max-width: 600px) {
              .info-grid {
                grid-template-columns: 1fr;
                gap: 8px;
              }
              .content {
                padding: 25px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
          
            
            <div class="content">
              <div class="section">
                <div class="section-title">
                  Informations client
                </div>
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
                <div class="section-title">
                Détails du projet
                </div>
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
                <div class="section-title">
                Description du projet
                </div>
                <div class="message-box">
                  <p>${(message || '').replace(/\n/g, '<br>')}</p>
                </div>
              </div>
                       
            </div>
            
              <p style="margin-top: 15px; font-size: 11px;">
                Cet email a été envoyé automatiquement depuis le formulaire de contact du site NEXOLIA Consulting.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: 'logoNexo.png',
                    path: path.join(__dirname, '../public/logoNexo.png'),
                    cid: 'logoNexolia'
                }
            ]
        };

        // Template email client (version complète avec logo)
        const clientMailOptions = {
            from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
            to: email,
            subject: '✨ Confirmation de votre demande - NEXOLIA Consulting',
            html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation NEXOLIA Consulting</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
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
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .header h1 {
              color: white;
              font-size: 26px;
              margin-bottom: 10px;
            }
            
            .content {
              padding: 40px 35px;
            }
            
            .welcome-message {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .welcome-message h2 {
              color: #53828a;
              margin-bottom: 15px;
            }
            
            .info-card {
              background: #f8f9fa;
              border-radius: 15px;
              padding: 25px;
              margin: 25px 0;
            }
            
            .info-card h3 {
              color: #b05f76;
              margin-bottom: 15px;
              font-size: 18px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .info-item:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-weight: 600;
              color: #666;
            }
            
            .info-value {
              color: #1a1a1a;
              font-weight: 500;
            }
            
            .next-steps {
              background: linear-gradient(135deg, #f0f9ff, #fff5f7);
              border-radius: 15px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
            }
            
            .next-steps h3 {
              color: #53828a;
              margin-bottom: 15px;
            }
            
            .step-list {
              text-align: left;
              margin: 20px 0;
              padding-left: 20px;
            }
            
            .step-list li {
              margin: 10px 0;
              color: #555;
            }
            
            .contact-info {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            
            .contact-info p {
              margin: 8px 0;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 25px 35px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            
            .footer p {
              color: #888;
              font-size: 12px;
              margin: 5px 0;
            }
            
            @media (max-width: 600px) {
              .content {
                padding: 25px;
              }
              .info-item {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:logoNexolia" alt="NEXOLIA Consulting" class="logo" />
              <h1>Merci pour votre confiance !</h1>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <h2>Bonjour ${firstName} ${lastName},</h2>
                <p>Nous avons bien reçu votre demande et nous vous remercions chaleureusement de l'intérêt que vous portez à <strong>NEXOLIA CONSULTING</strong>.</p>
              </div>
              
              <div class="info-card">
                <h3>Récapitulatif de votre demande</h3>
                <div class="info-item">
                  <span class="info-label">Type de projet : </span>
                  <span class="info-value"><strong>${getProjectTypeLabel(projectType)}</strong></span>
                </div>
                <div class="info-item">
                  <span class="info-label">Budget estimé : </span>
                  <span class="info-value">${getBudgetLabel(budget)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Délai souhaité : </span>
                  <span class="info-value">${getTimelineLabel(timeline)}</span>
                </div>
              </div>
              
              <div class="next-steps">
                <h3>Prochaines étapes</h3>
                <ul class="step-list">
                  <li>✓ Notre équipe analyse votre projet dans les plus brefs délais</li>
                  <li>✓ Un expert vous contactera sous <strong>24h ouvrées</strong></li>
                  <li>✓ Nous organiserons un rendez-vous pour affiner vos besoins</li>
                  <li>✓ Vous recevrez une proposition personnalisée</li>
                </ul>
              </div>
              
              <div class="contact-info">
                <p><strong>Besoin d'une réponse immédiate ?</strong></p>
                <p>Notre équipe est disponible du lundi au vendredi, 8h30 à 17h00</p>
                <p>Téléphone : <strong>+216 23 267 646</strong> | <strong>+216 92 233 647</strong></p>
                <p>Email : <strong>contact@nexolia-consulting.com</strong></p>
              </div>
              
              <p style="text-align: center; margin-top: 30px; color: #666;">
                En attendant, n'hésitez pas à consulter notre site web pour découvrir nos réalisations.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>NEXOLIA CONSULTING</strong> - L'innovation au service de votre réussite</p>
              <p>📍 Tunis, Ariana | Pôle Technologique El Ghazala</p>
              <p>© 2024 NEXOLIA CONSULTING - Tous droits réservés</p>
              <p style="margin-top: 10px; font-size: 11px;">
                Cet email est un message automatique, merci de ne pas y répondre directement.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: 'logoNexo.png',
                    path: path.join(__dirname, '../public/logoNexo.png'),
                    cid: 'logoNexolia'
                }
            ]
        };

        // Envoyer les deux emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(clientMailOptions);

        return res.status(200).json({
            success: true,
            message: 'Emails envoyés avec succès'
        });

    } catch (error) {
        console.error('Erreur détaillée:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi des emails',
            error: error.message
        });
    }
};

module.exports = {
    sendEmail,
};