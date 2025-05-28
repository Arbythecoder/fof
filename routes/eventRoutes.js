const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
// const auth = require('../middleware/authMiddleware'); // Ensure this path is correct
const upload = require('../middleware/uploadMiddleware'); // Ensure this path is correct
// User routes
router.post('/', authMiddleware.protect, eventController.createEvent);
router.get('/my-events', authMiddleware.protect, eventController.getMyEvents);

// Admin routes
router.use(authMiddleware.restrictTo('admin'));
router.get('/', eventController.getAllEvents);
router.patch('/:id', eventController.updateEventStatus);
// eventroutes
router.post('/:id/upload', auth, upload.array('images', 5), eventController.uploadEventImages);
module.exports = router;