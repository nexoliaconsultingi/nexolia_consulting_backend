const nodemailer = require("nodemailer");
const path = require("path");

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

    // Validation
    if (!firstName || !lastName || !email || !projectType || !message) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants",
      });
    }

    // Labels
    const projectTypes = {
      web: "Site Web / E-commerce",
      mobile: "Application Mobile",
      saas: "Plateforme SaaS",
      design: "Design & UX/UI",
      spfx: "Microsoft SPFx Solutions",
      "power-automate": "Power Automate Workflows",
      "power-bi": "Power BI Reporting Dashboards",
      "microsoft-project": "Microsoft Project PMO Installation",
    };

    // SMTP
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

    // Vérification SMTP
    await transporter.verify();

    // =========================
    // MAIL ADMIN
    // =========================
    const adminMail = {
      from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
      to: process.env.EMAIL_USER_NEXOLIA,
      subject: `Nouvelle demande - ${firstName} ${lastName}`,
      html: `
        <h2>Nouvelle demande client</h2>

        <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone || "Non renseigné"}</p>
        <p><strong>Entreprise :</strong> ${company || "Non renseignée"}</p>

        <hr/>

        <p><strong>Projet :</strong> ${
          projectTypes[projectType] || projectType
        }</p>

        <p><strong>Budget :</strong> ${budget || "Non spécifié"}</p>

        <p><strong>Délai :</strong> ${timeline || "Non spécifié"}</p>

        <hr/>

        <p><strong>Description :</strong></p>

        <p>${message.replace(/\n/g, "<br>")}</p>

        <hr/>

        <p><strong>Newsletter :</strong> ${
          newsletter ? "Oui" : "Non"
        }</p>
      `,
      attachments: [
        {
          filename: "logoNexo.png",
          path: path.join(__dirname, "../public/logoNexo.png"),
          cid: "logoNexolia",
        },
      ],
    };

    // =========================
    // MAIL CLIENT
    // =========================
    const clientMail = {
      from: `"NEXOLIA Consulting" <${process.env.EMAIL_USER_NEXOLIA}>`,
      to: email,
      subject: "Confirmation de votre demande",
      html: `
        <h2>Bonjour ${firstName},</h2>

        <p>
          Nous avons bien reçu votre demande.
        </p>

        <p>
          Notre équipe vous contactera rapidement.
        </p>

        <br/>

        <strong>NEXOLIA CONSULTING</strong>
      `,
    };

    // Envoi
    await transporter.sendMail(adminMail);
    await transporter.sendMail(clientMail);

    return res.status(200).json({
      success: true,
      message: "Emails envoyés avec succès",
    });

  } catch (error) {
    console.error("EMAIL ERROR =>", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendEmail,
};