const RecipeTemplate = require('../models/recipeTemplateModel');
const CustomRecipe = require('../models/customRecipeModel');
const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createCustomRecipe = catchAsync(async (req, res, next) => {
  const { ingredients, instructions, name } = req.body;
  
  const recipe = await CustomRecipe.create({
    user: req.user._id,
    name,
    ingredients,
    instructions,
    isTemplate: false
  });

  res.status(201).json({
    status: 'success',
    data: recipe
  });
});

exports.getSavedRecipes = catchAsync(async (req, res, next) => {
  const recipes = await CustomRecipe.find({ user: req.user._id });
  
  res.status(200).json({
    status: 'success',
    results: recipes.length,
    data: recipes
  });
});

// recipe
// controllers/recipeController.js
const Recipe = require('../models/recipeModel');
const Ingredient = require('../models/ingredientModel');
const Order = require('../models/orderModel');
const Subscription = require('../models/subscriptionModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Build a new recipe (from template or scratch)
// @route   POST /api/recipes/build
exports.buildRecipe = catchAsync(async (req, res, next) => {
  const { templateId, ingredients, name, instructions } = req.body;
  
  // Validate ingredients exist and get pricing
  const ingredientDocs = await Ingredient.find({
    _id: { $in: ingredients.map(i => i.ingredient) }
  });
  
  if (ingredientDocs.length !== ingredients.length) {
    return next(new AppError('One or more ingredients not found', 404));
  }

  // Calculate price
  const price = ingredients.reduce((total, curr) => {
    const ing = ingredientDocs.find(i => i._id.equals(curr.ingredient));
    return total + (ing.price * curr.quantity);
  }, 0);

  // Create recipe
  const recipe = await Recipe.create({
    name,
    ingredients,
    instructions,
    user: req.user._id,
    baseTemplate: templateId || null,
    price,
    isTemplate: false
  });

  res.status(201).json({
    status: 'success',
    data: recipe
  });
});

// @desc    Order a custom recipe
// @route   POST /api/recipes/:id/order
exports.orderRecipe = catchAsync(async (req, res, next) => {
  const recipe = await Recipe.findOne({
    _id: req.params.id,
    user: req.user._id
  });
  
  if (!recipe) {
    return next(new AppError('Recipe not found', 404));
  }

  // Check if user has active subscription
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active'
  });

  // Apply subscription discount if exists
  const discount = subscription ? subscription.discountPercentage : 0;
  const finalPrice = recipe.price * (1 - (discount / 100));

  const order = await Order.create({
    user: req.user._id,
    recipe: recipe._id,
    amount: finalPrice,
    status: 'pending',
    deliveryDate: new Date(Date.now() + 3*24*60*60*1000) // 3 days from now
  });

  res.status(201).json({
    status: 'success',
    data: order
  });
});

// @desc    Get user's recipe collection (custom + saved templates)
// @route   GET /api/recipes/user-collection
exports.getUserRecipes = catchAsync(async (req, res, next) => {
  const [customRecipes, savedTemplates] = await Promise.all([
    Recipe.find({ user: req.user._id, isTemplate: false }),
    Recipe.find({ 
      _id: { $in: req.user.savedTemplates },
      isTemplate: true 
    })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      customRecipes,
      savedTemplates
    }
  });
});

// @desc    Save a recipe as template
// @route   POST /api/recipes/:id/save-template
exports.saveAsTemplate = catchAsync(async (req, res, next) => {
  const recipe = await Recipe.findByIdAndUpdate(
    req.params.id,
    { isTemplate: true },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: recipe
  });
});