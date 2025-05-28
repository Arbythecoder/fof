const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail'); // Ensure this utility is set up

exports.sendContactForm = async (req, res, next) => {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return next(new AppError('All fields are required', 400));
    }

    // Sending email logic
    try {
        await sendEmail({
            to: 'your-email@example.com', // Replace with your email
            subject: 'New Contact Form Submission',
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        });

        res.status(200).json({ status: 'success', message: 'Message sent successfully!' });
    } catch (err) {
        return next(new AppError('Error sending message. Please try again later.', 500));
    }
};