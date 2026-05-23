const mongoose = require ('mongoose');
require("dotenv").config();

const mongodb_URL = process.env.DB_Online_URL



mongoose.connect(mongodb_URL)
.then(()=>console.log("Connecting to DB *_*"))
.catch((err)=>console.log(err))


module.exports= mongoose