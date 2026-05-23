// models/visitorModel.js
const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
  page: { type: String, required: true },
  enteredAt: { type: Date, required: true },
  duration: { type: Number, default: 0 } // en ms
});

const sessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  session_start: { type: Date, required: true },
  session_end: { type: Date },
  page_views: [pageSchema]
});

const visitorSchema = new mongoose.Schema({
  visitor_id: { type: String, required: true, unique: true },
  sessions: [sessionSchema]
}, { timestamps: true });

const Visitor = mongoose.model("Visitor", visitorSchema);
module.exports = Visitor;