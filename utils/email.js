module.exports = async function sendEmail(options) {
  // Dummy email sender for development
  console.log('Pretend sending email to:', options.email || options.to);
  return Promise.resolve();
};
// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  }
});

exports.sendOrderConfirmation = async (user, order) => {
  const mailOptions = {
    from: 'orders@yourdomain.com',
    to: user.email,
    subject: `Your Order #${order._id}`,
    html: generateOrderEmailHtml(user, order)
  };
  
  await transporter.sendMail(mailOptions);
};

function generateOrderEmailHtml(user, order) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Thank you for your order, ${user.name}!</h2>
      <p>Order #: ${order._id}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
      
      <h3>Order Summary</h3>
      ${order.items.map(item => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <p><strong>${item.name}</strong> (Qty: ${item.quantity})</p>
          <p>Price: €${item.price.toFixed(2)}</p>
        </div>
      `).join('')}
      
      <div style="margin-top: 20px;">
        <p><strong>Total: €${order.total.toFixed(2)}</strong></p>
      </div>
      
      <p>We'll notify you when your order ships.</p>
    </div>
  `;
}