import transporter from '../config/email.js';

/**
 * Send email using configured SMTP transporter
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Mazhai Vaanam Boutique" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw — email failure shouldn't block the main flow
    return null;
  }
};

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Mazhai Vaanam Boutique ✨',
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B102A; font-size: 28px; margin: 0;">Mazhai Vaanam</h1>
          <p style="color: #C8A34D; font-size: 12px; letter-spacing: 3px; margin-top: 4px;">PREMIUM BOUTIQUE</p>
        </div>
        <h2 style="color: #1A1A1A; font-size: 22px;">Welcome, ${user.firstName}!</h2>
        <p style="color: #555; line-height: 1.7; font-size: 15px;">
          Thank you for joining the Mazhai Vaanam family. We are delighted to have you as part of our community of connoisseurs who appreciate the art of fine handloom craftsmanship.
        </p>
        <p style="color: #555; line-height: 1.7; font-size: 15px;">
          Explore our curated collections of premium silk sarees, each woven with centuries of heritage and tradition.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/catalog" style="background: #6B102A; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
            EXPLORE COLLECTIONS
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          © Mazhai Vaanam Boutique. All rights reserved.
        </p>
      </div>
    `,
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #F0E6D2;">
          <strong>${item.name}</strong><br/>
          <span style="color: #888; font-size: 13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #F0E6D2; text-align: right;">
          ₹${item.price.toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed — ${order.orderId} ✨`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B102A; font-size: 28px; margin: 0;">Mazhai Vaanam</h1>
          <p style="color: #C8A34D; font-size: 12px; letter-spacing: 3px; margin-top: 4px;">ORDER CONFIRMATION</p>
        </div>
        <h2 style="color: #1A1A1A;">Thank you, ${user.firstName}!</h2>
        <p style="color: #555; line-height: 1.7;">Your order <strong>${order.orderId}</strong> has been confirmed. Here's a summary:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #6B102A; color: white;">
              <th style="padding: 12px; text-align: left;">Item</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background: #f9f5f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Total:</strong> ₹${order.totalAmount.toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Delivery:</strong> ${order.deliveryMode === 'express' ? 'Express (3-5 days)' : 'Standard (7-10 days)'}</p>
          <p style="margin: 4px 0;"><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/track-order?orderId=${order.orderId}" style="background: #6B102A; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
            TRACK ORDER
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© Mazhai Vaanam Boutique</p>
      </div>
    `,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset — Mazhai Vaanam Boutique',
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B102A; font-size: 28px; margin: 0;">Mazhai Vaanam</h1>
        </div>
        <h2 style="color: #1A1A1A;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.7;">
          Hi ${user.firstName}, we received a request to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #6B102A; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
            RESET PASSWORD
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© Mazhai Vaanam Boutique</p>
      </div>
    `,
  });
};

/**
 * Send order shipped notification
 */
export const sendOrderShippedEmail = async (user, order) => {
  return sendEmail({
    to: user.email,
    subject: `Your Order ${order.orderId} Has Been Shipped! 🚚`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B102A; font-size: 28px; margin: 0;">Mazhai Vaanam</h1>
        </div>
        <h2 style="color: #1A1A1A;">Your Order is on its Way!</h2>
        <p style="color: #555; line-height: 1.7;">
          Great news, ${user.firstName}! Your order <strong>${order.orderId}</strong> has been shipped.
        </p>
        <div style="background: #f9f5f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Tracking Number:</strong> ${order.trackingNumber || 'Will be updated shortly'}</p>
          <p style="margin: 4px 0;"><strong>Courier:</strong> ${order.courier || 'Premium Delivery'}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/track-order?orderId=${order.orderId}" style="background: #6B102A; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
            TRACK SHIPMENT
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© Mazhai Vaanam Boutique</p>
      </div>
    `,
  });
};

export default sendEmail;
