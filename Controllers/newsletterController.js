const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const {
    NewsletterClient,
    createNewsletterClientVerify,
    updateNewsletterClientVerify
} = require("../Models/newsletterClientModel");
const { StoreEmail } = require("../Models/storeEmailModel");
const { getSocket } = require("../socket");
require("dotenv").config();

// ---------------------------------------------------------------------------
// Clients abonnés à la newsletter de Nexolia Store
// ---------------------------------------------------------------------------

// @desc    Liste de tous les clients abonnés
// @route   GET /store/api/newsletter/client
// @access  Admin + Store
module.exports.getAllNewsletterClientsCtrl = asyncHandler(async (req, res) => {
    const clients = await NewsletterClient.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(clients);
});

// @desc    Créer un client abonné
// @route   POST /store/api/newsletter/client
// @access  Admin + Store
module.exports.createNewsletterClientCtrl = asyncHandler(async (req, res) => {
    const { error } = createNewsletterClientVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const email = req.body.email.trim().toLowerCase();
    const existing = await NewsletterClient.findOne({ email });
    if (existing) {
        return res.status(409).json({ message: "Un client avec cet email existe déjà" });
    }
    const client = await NewsletterClient.create({
        name: req.body.name ? req.body.name.trim() : '',
        email,
        subscribed: req.body.subscribed ?? true
    });
    // Temps réel : admin + store voient le nouveau client sans recharger
    getSocket()?.emitToStore('newsletter:clients:created', client);
    res.status(201).json(client);
});

// @desc    Modifier un client abonné
// @route   PUT /store/api/newsletter/client/:id
// @access  Admin + Store
module.exports.updateNewsletterClientCtrl = asyncHandler(async (req, res) => {
    const { error } = updateNewsletterClientVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.email !== undefined) updateData.email = req.body.email.trim().toLowerCase();
    if (req.body.subscribed !== undefined) updateData.subscribed = req.body.subscribed;

    const client = await NewsletterClient.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!client) {
        return res.status(404).json({ message: "Client not found" });
    }
    getSocket()?.emitToStore('newsletter:clients:updated', client);
    res.status(200).json(client);
});

// @desc    Supprimer un client abonné
// @route   DELETE /store/api/newsletter/client/:id
// @access  Admin + Store
module.exports.deleteNewsletterClientCtrl = asyncHandler(async (req, res) => {
    const client = await NewsletterClient.findByIdAndDelete(req.params.id);
    if (!client) {
        return res.status(404).json({ message: "Client not found" });
    }
    getSocket()?.emitToStore('newsletter:clients:deleted', { id: req.params.id });
    res.status(200).json({ message: "Client deleted successfully" });
});

// @desc    Inscription publique à la newsletter (formulaire du site store)
// @route   POST /store/api/newsletter/subscribe
// @access  Public
module.exports.subscribeNewsletterClientCtrl = asyncHandler(async (req, res) => {
    const { error } = createNewsletterClientVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const email = req.body.email.trim().toLowerCase();
    let client = await NewsletterClient.findOne({ email });
    if (client) {
        // Déjà inscrit : on réactive simplement l'abonnement s'il était désactivé
        if (!client.subscribed) {
            client.subscribed = true;
            if (req.body.name && req.body.name.trim()) client.name = req.body.name.trim();
            await client.save();
            getSocket()?.emitToStore('newsletter:clients:updated', client);
        }
        const count = await NewsletterClient.countDocuments({ subscribed: true });
        return res.status(200).json({
            message: "Vous êtes déjà abonné à la newsletter de Nexolia Store",
            client,
            count
        });
    }
    client = await NewsletterClient.create({
        name: req.body.name ? req.body.name.trim() : '',
        email,
        subscribed: true
    });
    getSocket()?.emitToStore('newsletter:clients:created', client);
    const count = await NewsletterClient.countDocuments({ subscribed: true });
    res.status(201).json({ message: "Inscription réussie à la newsletter", client, count });
});

// @desc    Nombre d'inscrits actifs à la newsletter
// @route   GET /store/api/newsletter/count
// @access  Public
module.exports.getNewsletterCountCtrl = asyncHandler(async (req, res) => {
    const count = await NewsletterClient.countDocuments({ subscribed: true });
    res.status(200).json({ count });
});

// ---------------------------------------------------------------------------
// Génération du HTML de l'email
// ---------------------------------------------------------------------------

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildNewsletterEmailHTML({ subject, content, imageSrc, offerUrl, signature, logoHtml }) {
    const text = escapeHtml(content || '').replace(/\n/g, '<br>');
    const sig = escapeHtml(signature || '').replace(/\n/g, '<br>');

    const imageHtml = imageSrc
        ? `<div style="text-align:center;margin:26px 0;">
             <img src="${escapeHtml(imageSrc)}" alt="Offre Nexolia Store" style="max-width:100%;border-radius:14px;display:block;margin:0 auto;"/>
           </div>`
        : '';

    const offerHtml = offerUrl
        ? `<div style="text-align:center;margin:28px 0;">
             <a href="${escapeHtml(offerUrl)}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#c93d87,#a0316b);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;">
               Découvrir l'offre
             </a>
           </div>`
        : '';

    // Logo de Nexolia Store placé dans la signature (ou monogramme en secours)
    const signatureLogoHtml = logoHtml
        ? `<img src="${logoHtml}" alt="Nexolia Store" style="max-height:64px;max-width:200px;display:block;margin:0 auto;" />`
        : `<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#c93d87,#0088cc);display:inline-block;line-height:56px;text-align:center;color:#ffffff;font-size:24px;font-weight:800;box-shadow:0 6px 16px rgba(192,60,135,0.30);">
             NS
           </div>`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:36px 40px;color:#1f2937;font-size:15px;line-height:1.7;">
              <div>${text}</div>
              ${imageHtml}
              ${offerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:34px 40px 26px 40px;border-top:1px solid #ececec;background:linear-gradient(180deg,#fafafa,#ffffff);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    ${signatureLogoHtml}
                    <div style="font-weight:800;color:#111827;font-size:16px;letter-spacing:0.5px;margin-top:14px;text-align:center;">L'équipe Nexolia Store</div>
                    <div style="width:48px;height:3px;border-radius:2px;background:linear-gradient(90deg,#c93d87,#0088cc);margin:10px auto 0 auto;"></div>
                    <div style="color:#6b7280;font-size:13px;line-height:1.7;margin-top:12px;padding:0 12px;text-align:center;">${sig}</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                <tr>
                  <td align="center" style="background:#f1f5f9;border-radius:12px;padding:12px 16px;">
                    <div style="color:#475569;font-size:12px;font-weight:600;letter-spacing:0.4px;">
                      Nexolia Store — Nouveautés, promotions &amp; soldes
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.6;">
              Vous recevez cet email car vous êtes abonné aux nouveautés de Nexolia Store.<br/>
              © ${new Date().getFullYear()} Nexolia Store - Tous droits réservés
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Envoi d'un email aux clients sélectionnés
// ---------------------------------------------------------------------------

// Sauvegarde une image en data URI (base64) vers un fichier sur le disque
// et retourne le chemin du fichier (ou null si invalide)
function dataUriToFile(dataUri, uploadDir) {
    const match = String(dataUri).match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return null;
    const extMap = { jpeg: 'jpg', 'svg+xml': 'svg' };
    const ext = extMap[match[1]] || match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) return null;
    const filename = `offer-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(filePath, buffer);
        return filePath;
    } catch (err) {
        console.error('❌ Échec de la sauvegarde de l’image :', err.message);
        return null;
    }
}

function removeFileIfExists(filePath) {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* silencieux */ }
}

// @desc    Envoyer un email de newsletter aux clients sélectionnés
// @route   POST /store/api/newsletter/send
// @access  Admin + Store
module.exports.sendNewsletterEmailCtrl = asyncHandler(async (req, res) => {
    const { subject, content, imageUrl, offerUrl, signature, clientIds, allClients } = req.body;

    if (!subject || !subject.trim()) {
        return res.status(400).json({ message: "L'objet de l'email est obligatoire" });
    }
    if (!content || !content.trim()) {
        return res.status(400).json({ message: "Le contenu de l'email est obligatoire" });
    }

    // Récupérer les destinataires (seuls les abonnés actifs reçoivent les emails)
    let recipients = [];
    if (allClients) {
        recipients = await NewsletterClient.find({ subscribed: true }).lean();
    } else if (Array.isArray(clientIds) && clientIds.length > 0) {
        recipients = await NewsletterClient.find({ _id: { $in: clientIds }, subscribed: true }).lean();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const uniqueEmails = [
        ...new Set(
            recipients
                .map((c) => (c.email || '').trim().toLowerCase())
                .filter((e) => emailRegex.test(e))
        )
    ];

    if (uniqueEmails.length === 0) {
        return res.status(400).json({ message: "Aucun client valide sélectionné (emails manquants)" });
    }

    // Logo Nexolia Store : cherché dans le dossier public du backend
    let logoPath = null;
    const possibleLogoPaths = [
        path.join(__dirname, '..', 'public', 'logoNexoliaStore.png'),
        path.join(process.cwd(), 'public', 'logoNexoliaStore.png'),
        path.join(__dirname, '..', 'public', 'logoNexo.png'),
    ];
    for (const p of possibleLogoPaths) {
        if (fs.existsSync(p)) {
            logoPath = p;
            break;
        }
    }

    const logoHtml = logoPath ? 'cid:logoNexoliaStore' : '';

    // Image de l'offre : si c'est un data URI (image uploadée), on la sauvegarde
    // sur le disque et on l'attache en CID (les clients mail bloquent les data URI).
    // Si c'est une URL classique, on l'utilise directement.
    let imageSrc = imageUrl || '';
    let offerAttachment = null;
    if (imageUrl && imageUrl.startsWith('data:image/')) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        const filePath = dataUriToFile(imageUrl, uploadDir);
        if (filePath) {
            offerAttachment = {
                filename: path.basename(filePath),
                path: filePath,
                cid: 'offerImage'
            };
            imageSrc = 'cid:offerImage';
        }
    }

    // Générer le HTML de l'email
    const html = buildNewsletterEmailHTML({
        subject: subject.trim(),
        content: content.trim(),
        imageSrc,
        offerUrl: offerUrl || '',
        signature: signature || '',
        logoHtml
    });

    // Transporteur SMTP (même configuration que les emails de contact)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER_NEXOLIA,
            pass: process.env.EMAIL_PASS_NEXOLIA
        },
        tls: { rejectUnauthorized: false }
    });

    await transporter.verify();

    // Envoyer à chaque destinataire
    const attachments = [];
    if (logoPath) {
        attachments.push({
            filename: 'logoNexoliaStore.png',
            path: logoPath,
            cid: 'logoNexoliaStore'
        });
    }
    if (offerAttachment) {
        attachments.push(offerAttachment);
    }

    const results = await Promise.allSettled(uniqueEmails.map(async (to) => {
        await transporter.sendMail({
            from: `"Nexolia Store" <${process.env.EMAIL_USER_NEXOLIA}>`,
            to,
            subject: subject.trim(),
            html,
            attachments
        });
    }));

    // Nettoyer le fichier temporaire de l'image uploadée
    removeFileIfExists(offerAttachment && offerAttachment.path);

    let sentCount = 0;
    let failed = 0;
    results.forEach((r) => {
        if (r.status === 'fulfilled') sentCount++;
        else failed++;
    });

    if (sentCount === 0) {
        return res.status(500).json({ message: "L'envoi des emails a échoué" });
    }

    // Enregistrer dans l'historique (non bloquant : si l'enregistrement échoue,
    // les emails sont déjà partis, on répond quand même un succès)
    let emailRecord = null;
    try {
        emailRecord = await StoreEmail.create({
            subject: subject.trim(),
            content: content.trim(),
            contentHtml: html,
            imageUrl: imageUrl || '',
            offerUrl: offerUrl || '',
            signature: signature || '',
            recipientCount: sentCount,
            recipientEmails: uniqueEmails,
            sentBy: req.user ? req.user.name : '',
            sentById: req.user ? String(req.user._id) : ''
        });

        // Temps réel : l'historique se met à jour côté admin + store
        getSocket()?.emitToStore('newsletter:sent', emailRecord);
    } catch (saveErr) {
        console.error('❌ Historique non enregistré :', saveErr.message);
    }

    const message = failed > 0
        ? `Email envoyé à ${sentCount} client(s), ${failed} échec(s)`
        : `Email envoyé avec succès à ${sentCount} client(s)`;
    res.status(200).json({ message, email: emailRecord });
});

// @desc    Liste de l'historique des emails envoyés
// @route   GET /store/api/newsletter/history
// @access  Admin + Store
module.exports.getEmailHistoryCtrl = asyncHandler(async (req, res) => {
    const history = await StoreEmail.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(history);
});

// @desc    Détails d'un email envoyé
// @route   GET /store/api/newsletter/history/:id
// @access  Admin + Store
module.exports.getEmailHistoryDetailCtrl = asyncHandler(async (req, res) => {
    const email = await StoreEmail.findById(req.params.id).lean();
    if (!email) {
        return res.status(404).json({ message: "Email not found" });
    }
    res.status(200).json(email);
});

// @desc    Supprimer un enregistrement de l'historique
// @route   DELETE /store/api/newsletter/history/:id
// @access  Admin + Store
module.exports.deleteEmailHistoryCtrl = asyncHandler(async (req, res) => {
    const email = await StoreEmail.findByIdAndDelete(req.params.id);
    if (!email) {
        return res.status(404).json({ message: "Email not found" });
    }
    getSocket()?.emitToStore('newsletter:history:deleted', { id: req.params.id });
    res.status(200).json({ message: "Email deleted successfully" });
});
