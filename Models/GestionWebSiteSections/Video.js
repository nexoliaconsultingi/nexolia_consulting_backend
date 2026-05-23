const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    youtubeLink: { type: String, required: true }, // lien YouTube (embed ou watch)
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);

module.exports = { Video };