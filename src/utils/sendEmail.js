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
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788719141519.png" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
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
        <td style="padding: 14px 12px; border-bottom: 1px solid #F0E6D2;">
          <strong style="color: #1A1A1A; font-size: 14px;">${item.name}</strong><br/>
          <span style="color: #888; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #F0E6D2; text-align: right; color: #1A1A1A; font-weight: 600; font-size: 14px;">
          ₹${(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const totalAmt = order.totalAmount || order.finalAmount || 0;
  const taxableAmount = Math.round(totalAmt / 1.05);
  const totalTax = totalAmt - taxableAmount;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  const giftMessageHtml = order.giftMessage
    ? `
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <div style="font-weight: 700; color: #B45309; font-size: 13px; margin-bottom: 4px;">
          🎁 GIFT CARD MESSAGE:
        </div>
        <div style="color: #78350F; font-style: italic; font-size: 14px; line-height: 1.5; word-break: break-word;">
          "${order.giftMessage.replace(/^["']+|["']+$/g, '')}"
        </div>
      </div>
    `
    : '';

  const savingsHtml = order.totalSavings > 0 
    ? `
      <div style="background: rgba(40, 167, 69, 0.08); border: 1px dashed #28a745; border-radius: 8px; padding: 12px; text-align: center; margin: 15px 0;">
        <p style="color: #1e7e34; font-size: 14px; font-weight: 600; margin: 0;">
          ✨ Amazing! You saved ₹${order.totalSavings.toLocaleString('en-IN')} on this order!
        </p>
      </div>
    `
    : '';

  return sendEmail({
    to: user.email,
    subject: `Official Tax Invoice & Order Confirmation — #${order.orderId} ✨`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 650px; margin: 0 auto; padding: 35px; background: #FFFDF8; border-top: 5px solid #6B102A; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788719141519.png" alt="Mazhai Vaanam" style="max-height: 75px; margin-bottom: 8px;" />
          <p style="color: #C8A34D; font-size: 11px; letter-spacing: 4px; margin-top: 6px; text-transform: uppercase;">Luxury Handloom Boutique</p>
        </div>

        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #F0E6D2; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h2 style="color: #1A1A1A; font-size: 20px; margin: 0; font-weight: 600;">Tax Invoice & Receipt</h2>
            <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #28a745; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;">CONFIRMED</span>
          </div>
        </div>

        <p style="color: #555; line-height: 1.7; font-size: 14px;">
          Dear <strong>${user.firstName || 'Valued Customer'}</strong>, thank you for your order! Here is your official Tax Invoice and Order breakdown:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #6B102A; color: white;">
              <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: 1px;">ITEM DESCRIPTION</th>
              <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; letter-spacing: 1px;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <!-- Invoice Breakdown Table -->
        <div style="background: #f9f5f0; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #F0E6D2; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #555;">
            <span>Subtotal (MRP):</span>
            <span>₹${(order.mrpTotal || order.subtotal || totalAmt).toLocaleString('en-IN')}</span>
          </div>
          ${order.couponDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #28a745;">
              <span>Coupon Discount (${order.couponCode}):</span>
              <span>- ₹${order.couponDiscount.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
          ${order.convenienceFee > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #555;">
              <span>Convenience Fee:</span>
              <span>₹${order.convenienceFee.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
          ${order.giftPackCharge > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #555;">
              <span>🎁 Gift Packaging Addon:</span>
              <span>₹${order.giftPackCharge.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #555;">
            <span>Shipping & Handling:</span>
            <span>${order.shippingFee > 0 ? `₹${order.shippingFee.toLocaleString('en-IN')}` : 'FREE (Complimentary)'}</span>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0 6px 0; padding-top: 8px; color: #777; font-size: 12px;">
            <div>GST Tax Breakdown (5% Apparel): Taxable ₹${taxableAmount.toLocaleString('en-IN')} | CGST ₹${cgst.toLocaleString('en-IN')} | SGST ₹${sgst.toLocaleString('en-IN')}</div>
          </div>

          <div style="display: flex; justify-content: space-between; border-top: 2px solid #6B102A; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 700; color: #6B102A;">
            <span>Grand Total Paid:</span>
            <span>₹${totalAmt.toLocaleString('en-IN')}</span>
          </div>
        </div>

        ${giftMessageHtml}
        ${savingsHtml}

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.FRONTEND_URL}/track-order?orderId=${order.orderId}" style="background: #6B102A; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; border-radius: 4px; display: inline-block;">
            TRACK ORDER ONLINE
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 25px 0;" />
        <div style="text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 3px 0;">© ${new Date().getFullYear()} Mazhai Vaanam Boutique. All rights reserved.</p>
          <p style="color: #aaa; font-size: 11px; margin: 3px 0;">124, Silk Weaver Street, Coimbatore, Tamil Nadu - 641001</p>
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
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788719141519.png" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
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
          <img src="https://mazhaivaanam2026pvi.s3.ap-southeast-1.amazonaws.com/assets/email-logo-1788719141519.png" alt="Mazhai Vaanam" style="max-height: 80px; margin-bottom: 10px;" />
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

/**
 * Send low stock alert email to admin
 */
export const sendLowStockEmail = async (product, currentStock) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return null;

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ Low Stock Alert: ${product.name}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #d97706; margin-top: 0;">⚠️ Low Stock Alert</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Hello Admin,<br><br>
          This is an automated alert. The inventory for the following product is running very low:
        </p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d97706;">
          <p style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;"><strong>Product Name:</strong> ${product.name}</p>
          <p style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;"><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
          <p style="margin: 0; font-size: 15px; color: #ef4444;"><strong>Current Stock:</strong> ${currentStock} item(s) left</p>
        </div>
        <p style="color: #334155; font-size: 15px;">
          Please consider restocking this item soon.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Mazhai Vaanam Inventory System
        </p>
      </div>
    `,
  });
};

export default sendEmail;
