const Event = require('../models/eventModel');
const asyncHandler = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.createEvent = asyncHandler(async (req, res, next) => {
  const { eventType, eventDate, startTime, endTime, guests, specialRequests } = req.body;

  // Validate time slot
  const conflict = await Event.findOne({
    eventDate: new Date(eventDate),
    $or: [
      { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
      { startTime: { $gte: startTime, $lte: endTime } }
    ]
  });

  if (conflict) return next(new AppError('Time slot already booked', 400));

  // Pricing matrix (in kobo)
  const basePrice = {
    'private-dinner': 50000,  // ₦500 per guest base
    'cooking-class': 30000,   // ₦300 per guest base
    'corporate-event': 75000, // ₦750 per guest base
    'birthday-party': 45000,  // ₦450 per guest base
    'wedding': 100000,        // ₦1000 per guest base
    'other': 40000            // ₦400 per guest base
  };

  if (!basePrice[eventType]) return next(new AppError('Invalid event type', 400));

  const event = await Event.create({
    user: req.user._id,
    eventType,
    eventDate: new Date(eventDate),
    startTime,
    endTime,
    guests,
    specialRequests,
    quoteAmount: basePrice[eventType] * guests,
    status: 'pending',
    paymentStatus: 'unpaid'
  });

  res.status(201).json({ status: 'success', data: event });
});

// @desc    Get user's events
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ user: req.user._id });
  res.status(200).json({ status: 'success', data: events });
});

// @desc    Get all events (Admin)
// @route   GET /api/events
// @access  Private/Admin
exports.getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().populate('user', 'name email');
  res.status(200).json({ status: 'success', data: events });
});

// @desc    Update event status (Admin)
// @route   PATCH /api/events/:id
// @access  Private/Admin
exports.updateEventStatus = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!event) return next(new AppError('Event not found', 404));
  
  res.status(200).json({ status: 'success', data: event });
});
// controllers/eventController.js
exports.bookEvent = asyncHandler(async (req, res, next) => {
  const { eventType, eventDate, guests, specialRequests } = req.body;
  
  // Add validation
  if (!['private-dinner', 'cooking-class', 'corporate-event'].includes(eventType)) {
    return next(new AppError('Invalid event type', 400));
  }

  const event = await Event.create({
    user: req.user._id,
    eventType,
    eventDate: new Date(eventDate),
    guests,
    specialRequests,
    status: 'pending'
  });

  // Send confirmation email
  await sendEmail({
    email: req.user.email,
    subject: 'Event Booking Confirmation',
    message: `Your ${eventType} event has been booked successfully.`
  });

  res.status(201).json({ status: 'success', data: event });
});
// For event image uploads
const uploadEventImages = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (req.files) {
      event.images = req.files.map(file => file.path);
      await event.save();
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
};
exports.uploadEventImages = uploadEventImages;