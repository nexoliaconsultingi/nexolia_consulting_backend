const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use true for port 465, false for port 587
  auth: {
    user: "wahbisj@gmail.com",
    pass: "bvqwwgmqtaxhabax",
  },
});


// Send an email using async/await
(async () => {
  const info = await transporter.sendMail({
    from: '"wahbi" <wahbisj@gmail.com>',
    to: "contact@nexolia-consulting.com",
    subject: "Hello ✔",
    text: "Hello world?", // Plain-text version of the message
    html: "<b>Hello world?</b>", // HTML version of the message
  });

  console.log("Message sent:", info.messageId);
})();