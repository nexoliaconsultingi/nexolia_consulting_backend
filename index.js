const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
require("./Config/DBConnect")

const server = http.createServer(app);
const { initSocket } = require('./socket');
initSocket(server);





// Imported Routes Nexolia-Medica :
const authRoute = require("./Routes/authRoute");
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
const fournisseurRoute = require("./Routes/fournisseurRoute");
const depotRoute = require("./Routes/depotRoute");
const zoneRoute = require("./Routes/zoneRoute");
const productRoute = require("./Routes/productRoute");
const categoryRoute = require("./Routes/categoryRoute");
const flashOfferRoute = require("./Routes/flashOfferRoute");
const packageRoute = require("./Routes/packageRoute");
const giftRoute = require("./Routes/giftRoute");
const clientRoute = require("./Routes/clientRoute");
const newsletterRoute = require("./Routes/newsletterRoute");
const storeVideoRoute = require("./Routes/storeVideoRoute");
const storeStatusRoute = require("./Routes/storeStatusRoute");
const discountCodeRoute = require("./Routes/discountCodeRoute");
const orderRoute = require("./Routes/orderRoute");
const deliveryAgencyRoute = require("./Routes/deliveryAgencyRoute");
const companyRoute = require("./Routes/companyRoute");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



//middlwaere :

app.use(cors({
  origin: [ "http://localhost:3000","http://localhost:3001","https://nexolia-consulting.com","https://api.nexolia-consulting.com","https://api.nexolia-consulting.com/chat/api","https://api.nexolia-consulting.com/user/api","https://api.nexolia-consulting.com/user"],
  methods: ['GET', 'POST','DELETE',"PUT","PATCH"],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Path routes Nexolia-Medica : 
app.use("/user/api",authRoute);
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


// Path routes Store :
app.use("/store/api/fournisseur", fournisseurRoute);
app.use("/store/api/depot", depotRoute);
app.use("/store/api/zone", zoneRoute);
app.use("/store/api/product", productRoute);
app.use("/store/api/category", categoryRoute);
app.use("/store/api/flashoffer", flashOfferRoute);
app.use("/store/api/package", packageRoute);
app.use("/store/api/gift", giftRoute);
app.use("/store/api/client", clientRoute);
app.use("/store/api/newsletter", newsletterRoute);
app.use("/store/api/video", storeVideoRoute);
app.use("/store/api/status", storeStatusRoute);
app.use("/store/api/discountcode", discountCodeRoute);
app.use("/store/api/order", orderRoute);
app.use("/store/api/deliveryagency", deliveryAgencyRoute);
app.use("/company/api", companyRoute);


//test
app.get('/', (req, res) => {
  res.send('✅ Backend Nexolia-Consulting opérationnel *_*.');
});

// Gestion des erreurs : toujours répondre en JSON (jamais une page HTML)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err.message);
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: details.join(', ') });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload trop volumineux' });
  }
  return res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});



  const port =process.env.PORT;

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    // Surveille périodiquement les offres flash expirées (revert automatique des produits)
    const { startFlashOfferWatchdog } = require("./Controllers/flashOfferController");
    startFlashOfferWatchdog();
  })


