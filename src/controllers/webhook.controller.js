import crypto from 'crypto';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * POST /api/webhooks/razorpay
 * Webhook endpoint for Razorpay events
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // 1. Verify Signature
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Webhook] Received Razorpay event: ${event}`);

    // 2. Handle payment.failed
    if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id; // Razorpay order ID

      if (orderId) {
        const order = await Order.findOne({ razorpayOrderId: orderId });
        
        if (order && order.status !== 'CANCELLED') {
          console.log(`[Webhook] Cancelling order ${order.orderId} due to payment failure.`);
          
          order.paymentStatus = 'failed';
          order.status = 'CANCELLED';
          order.statusHistory.push({
            status: 'CANCELLED',
            note: `Payment failed (Razorpay webhook): ${payment.error_description || 'Unknown error'}`,
          });
          
          await order.save();

          // Release inventory
          for (const item of order.items) {
            await Inventory.findOneAndUpdate(
              { product: item.product },
              { 
                $inc: { reserved: -item.quantity },
                $push: {
                  stockHistory: {
                    type: 'adjustment',
                    quantity: item.quantity,
                    note: `Released reserved stock - Order ${order.orderId} payment failed webhook`,
                  },
                },
              }
            );
          }
        }
      }
    }

    // Always return 200 OK to Razorpay so it knows we received it
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook] Error handling Razorpay webhook:', error);
    res.status(500).send('Webhook Error');
  }
};
