const sendMfaEmail = require("./utils/sendMfaEmail")

sendMfaEmail("contact@nexolia-consulting.com", "123456")
  .then(() => console.log("Test email envoyé"))
  .catch(err => console.error(err))
