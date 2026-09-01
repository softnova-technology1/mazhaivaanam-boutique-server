import transporter from '../config/email.js';

/**
 * Send email using configured SMTP transporter
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const isPlaceholder = !process.env.SMTP_USER || 
                          process.env.SMTP_USER === 'your_email@gmail.com' || 
                          !process.env.SMTP_PASS || 
                          process.env.SMTP_PASS === 'your_email_app_password';

    if (isPlaceholder) {
      console.log(`ℹ️  [Email Skipped] "${subject}" -> ${to} (SMTP credentials not configured in .env)`);
      return null;
    }

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
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8; border-top: 5px solid #6B102A; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 35px;">
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788261890089.jpg" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
          <p style="color: #C8A34D; font-size: 11px; letter-spacing: 4px; margin-top: 8px; text-transform: uppercase;">Premium Boutique</p>
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
        <td style="padding: 16px 12px; border-bottom: 1px solid #F0E6D2;">
          <strong style="color: #1A1A1A; font-size: 15px;">${item.name}</strong><br/>
          <span style="color: #888; font-size: 13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #F0E6D2; text-align: right; color: #1A1A1A; font-weight: 600;">
          ₹${item.price.toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const savingsHtml = order.totalSavings > 0 
    ? `
      <div style="background: rgba(40, 167, 69, 0.08); border: 1px dashed #28a745; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
        <span style="font-size: 18px;">✨</span>
        <p style="color: #1e7e34; font-size: 15px; font-weight: 600; margin: 5px 0 0 0;">
          Amazing! You saved ₹${order.totalSavings.toLocaleString('en-IN')} on this order today!
        </p>
      </div>
    `
    : '';

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed — ${order.orderId} ✨`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8; border-top: 5px solid #6B102A; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 35px;">
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788261890089.jpg" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
          <p style="color: #C8A34D; font-size: 11px; letter-spacing: 4px; margin-top: 8px; text-transform: uppercase;">Premium Boutique</p>
        </div>

        <h2 style="color: #1A1A1A; font-size: 22px; font-weight: normal; border-bottom: 1px solid #F0E6D2; padding-bottom: 15px;">Thank you, ${user.firstName}!</h2>
        <p style="color: #555; line-height: 1.8; font-size: 15px;">
          Your order <strong>${order.orderId}</strong> has been successfully confirmed. Our artisans are getting everything ready with the utmost care. Here is a summary of your beautiful selections:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <thead>
            <tr style="background: #6B102A; color: white;">
              <th style="padding: 14px 12px; text-align: left; font-size: 14px; font-weight: 500; letter-spacing: 1px;">ITEM</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 500; letter-spacing: 1px;">PRICE</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background: #f9f5f0; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #F0E6D2;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666; font-size: 14px;">Total Paid:</span>
            <strong style="color: #1A1A1A; font-size: 16px;">₹${order.totalAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666; font-size: 14px;">Delivery Mode:</span>
            <strong style="color: #1A1A1A; font-size: 14px;">${order.deliveryMode === 'express' ? 'Express (3-5 days)' : 'Standard (7-10 days)'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 14px;">Payment Method:</span>
            <strong style="color: #1A1A1A; font-size: 14px;">${(order.paymentMethod || '').toUpperCase()}</strong>
          </div>
        </div>

        ${savingsHtml}

        <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 35px; font-style: italic; text-align: center;">
          "Thank you for ordering from Mazhai Vaanam! We pour our heart and heritage into every weave, and we're so excited for you to experience the magic of our premium handcrafted sarees."
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/track-order?orderId=${order.orderId}" style="background: #6B102A; color: white; padding: 16px 36px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; border-radius: 4px; display: inline-block;">
            TRACK ORDER
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} Mazhai Vaanam Boutique. All rights reserved.</p>
          <p style="color: #bbb; font-size: 11px; margin: 5px 0;">Handcrafted in India</p>
        </div>
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
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8; border-top: 5px solid #6B102A; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 35px;">
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788261890089.jpg" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
          <p style="color: #C8A34D; font-size: 11px; letter-spacing: 4px; margin-top: 8px; text-transform: uppercase;">Premium Boutique</p>
        </div>

        <h2 style="color: #1A1A1A; font-size: 22px; font-weight: normal; border-bottom: 1px solid #F0E6D2; padding-bottom: 15px;">Your Order is on its Way!</h2>
        <p style="color: #555; line-height: 1.8; font-size: 15px;">
          Great news, ${user.firstName}! Your beautiful selections for order <strong>${order.orderId}</strong> have been carefully packaged and shipped.
        </p>
        
        <div style="background: #f9f5f0; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #F0E6D2; text-align: center;">
          <p style="color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Tracking Number</p>
          <strong style="color: #1A1A1A; font-size: 20px; letter-spacing: 1px; display: block; margin-bottom: 15px;">${order.trackingNumber || 'Will be updated shortly'}</strong>
          
          <p style="color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Courier Partner</p>
          <strong style="color: #1A1A1A; font-size: 16px;">${order.courier || 'Premium Delivery'}</strong>
        </div>

        <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 35px; font-style: italic; text-align: center;">
          "Thank you for choosing Mazhai Vaanam! We can't wait for you to experience the magic of our handcrafted sarees."
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/track-order?orderId=${order.orderId}" style="background: #6B102A; color: white; padding: 16px 36px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; border-radius: 4px; display: inline-block;">
            TRACK SHIPMENT
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} Mazhai Vaanam Boutique. All rights reserved.</p>
          <p style="color: #bbb; font-size: 11px; margin: 5px 0;">Handcrafted in India</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send order delivered notification
 */
export const sendOrderDeliveredEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #F0E6D2;">
          <strong style="color: #1A1A1A; font-size: 15px;">${item.name}</strong><br/>
          <span style="color: #888; font-size: 13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #F0E6D2; text-align: right; color: #1A1A1A; font-weight: 600;">
          ₹${item.price.toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    to: user.email,
    subject: `Order Delivered Successfully! ✨ [${order.orderId}]`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8; border-top: 5px solid #6B102A; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 35px;">
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788261890089.jpg" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
          <p style="color: #C8A34D; font-size: 11px; letter-spacing: 4px; margin-top: 8px; text-transform: uppercase;">Premium Boutique</p>
        </div>

        <h2 style="color: #1A1A1A; font-size: 22px; font-weight: normal; border-bottom: 1px solid #F0E6D2; padding-bottom: 15px;">Delivered Successfully, ${user.firstName}!</h2>
        <p style="color: #555; line-height: 1.8; font-size: 15px;">
          Your order <strong>${order.orderId}</strong> has been successfully delivered. We hope you absolutely love your premium handcrafted sarees!
        </p>
        
        <h3 style="color: #1A1A1A; margin-top: 35px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Final Invoice Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0 25px;">
          <thead>
            <tr style="background: #6B102A; color: white;">
              <th style="padding: 14px 12px; text-align: left; font-size: 14px; font-weight: 500; letter-spacing: 1px;">ITEM</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 500; letter-spacing: 1px;">PRICE</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background: #f9f5f0; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #F0E6D2;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666; font-size: 14px;">Total Paid:</span>
            <strong style="color: #1A1A1A; font-size: 16px;">₹${order.totalAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 14px;">Payment Method:</span>
            <strong style="color: #1A1A1A; font-size: 14px;">${(order.paymentMethod || '').toUpperCase()}</strong>
          </div>
        </div>

        <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 35px; font-style: italic; text-align: center;">
          "Thank you for ordering from Mazhai Vaanam! We pour our heart and heritage into every weave. If you have any questions, our support team is always here for you."
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/catalog" style="background: #6B102A; color: white; padding: 16px 36px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; border-radius: 4px; display: inline-block;">
            SHOP AGAIN
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} Mazhai Vaanam Boutique. All rights reserved.</p>
          <p style="color: #bbb; font-size: 11px; margin: 5px 0;">Handcrafted in India</p>
        </div>
      </div>
    `,
  });
};

export default sendEmail;
