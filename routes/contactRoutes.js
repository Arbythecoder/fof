const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController'); // Ensure this controller is created

// Route to handle contact form submissions
router.post('/', contactController.sendContactForm); // Use the controller method for processing

module.exports = router;