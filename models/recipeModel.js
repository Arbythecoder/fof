const mongoose = require('mongoose');

// models/recipeModel.js
const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    quantity: Number,
    unit: String
  }],
  instructions: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isTemplate: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  baseTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, // if derived from template
  price: Number, // calculated field
  image: String,
  prepTime: Number, // in minutes
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
}, { timestamps: true });
