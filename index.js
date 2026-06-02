const express = require('express');
const app = express();
const cors = require('cors');
// require("./Config/DBConnect")



// Imported Routes Nexolia-Medica :
// const authRoute = require("./Routes/authRoute");
// const visitorRoute = require("./Routes/visitorRoute");
// const partnersRoute = require("./Routes/GastionWebSiteSectionsRoutes/PartnerRoute");
// const videoRoute = require("./Routes/GastionWebSiteSectionsRoutes/VideoRoute");
// const faqRoute = require('./Routes/GastionWebSiteSectionsRoutes/FAQRoute');
// const serviceRoute = require("./Routes/GastionWebSiteSectionsRoutes/ServiceRoute");
// const reviewRoute = require("./Routes/GastionWebSiteSectionsRoutes/ReviewRoute");
// const emailListRoute = require('./Routes/GastionWebSiteSectionsRoutes/EmailListRoute');
// const quoteRoute = require("./Routes/quoteRoute"); // <-- à ajouter
// const companyRoute = require("./Routes/companyRoute");
// const galleryRoute = require("./Routes/GastionWebSiteSectionsRoutes/galleryRoute");
// const newsRoute = require("./Routes/newsRoute");
// const factureRoute = require ("./Routes/FactureRoute")

const sendEmailRoute = require("./Routes/sendEmailRoute");
const chatRoute = require("./Routes/chatRoute");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



//middlwaere :

app.use(cors({
  origin: [ "http://localhost:3000","https://nexolia-consulting.com","https://api.nexolia-consulting.com","https://api.nexolia-consulting.com/chat/api"],
  methods: ['GET', 'POST','DELETE',"PUT","PATCH"],
  allowedHeaders: ['Content-Type'],
}));



// Path routes Nexolia-Medica : 
// app.use('/user/api',authRoute);
// app.use("/visitorAnalytics/api", visitorRoute);
// app.use("/partner/api", partnersRoute);
// app.use("/video/api", videoRoute);
// app.use('/faq/api', faqRoute);
// app.use("/service/api", serviceRoute);
// app.use("/review/api", reviewRoute);
// app.use('/email-list/api', emailListRoute);
// app.use("/quote/api", quoteRoute);
// app.use("/company/api", companyRoute);
// app.use("/gallery/api", galleryRoute);
// app.use("/news/api", newsRoute);
// app.use("/facture/api", factureRoute);



app.use("/send-email/api", sendEmailRoute);


app.use("/chat/api", chatRoute);


//test
app.get('/', (req, res) => {
  res.send('✅ Backend Nexolia-Medica opérationnel.');
});



  const port =process.env.PORT || 2000;

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  })


