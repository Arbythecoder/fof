
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'A testimonial must have text']
    },
    author: {
        name: String,
        image: String,
        title: String
    },
    type: {
        type: String,
        enum: ['weekly-delivery', 'daily-delivery', 'general'],
        default: 'general'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
module.exports = Testimonial;