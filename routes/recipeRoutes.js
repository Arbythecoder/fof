// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middleware/authMiddleware');

// Recipe Builder Endpoints
router.post('/build', authMiddleware.protect, recipeController.buildRecipe);
router.post('/:id/order', authMiddleware.protect, recipeController.orderRecipe);
router.post('/:id/save-template', authMiddleware.protect, recipeController.saveAsTemplate);

// Recipe Collection Management
router.get('/user-collection', authMiddleware.protect, recipeController.getUserRecipes);
router.get('/templates', recipeController.getPublicTemplates);
router.post('/:id/favorite', authMiddleware.protect, recipeController.favoriteRecipe);

// Admin Endpoints
router.post('/admin/templates', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'),
  recipeController.createOfficialTemplate);

module.exports = router;


// recipebuilder
const express = require('express');

const recipeBuilderController = require('../controllers/recipeBuilderController');
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');

router.use(authMiddleware.protect);

router.post('/create', catchAsync(recipeBuilderController.createCustomRecipe));
router.get('/user-recipes', catchAsync(recipeBuilderController.getUserRecipes));
router.post('/:id/order', catchAsync(recipeBuilderController.orderCustomRecipe));

module.exports = router;