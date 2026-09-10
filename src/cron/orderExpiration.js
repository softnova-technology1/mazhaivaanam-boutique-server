import cron from 'node-cron';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';

/**
 * Automatically cancel abandoned pending orders
 * Runs every 30 minutes
 */
const startOrderExpirationCron = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running order expiration check...');
    try {
      // Find orders that are pending and older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const abandonedOrders = await Order.find({
        status: { $ne: 'CANCELLED' },
        paymentStatus: 'pending',
        createdAt: { $lt: oneHourAgo }
      });

      if (abandonedOrders.length === 0) {
        return;
      }

      console.log(`[CRON] Found ${abandonedOrders.length} abandoned orders. Cancelling and releasing inventory...`);

      for (const order of abandonedOrders) {
        order.status = 'CANCELLED';
        order.statusHistory.push({
          status: 'CANCELLED',
          note: 'Automatically cancelled due to abandoned payment (1 hour timeout)',
        });
        await order.save();

        // Release inventory for each item
        for (const item of order.items) {
          await Inventory.findOneAndUpdate(
            { product: item.product },
            { 
              $inc: { reserved: -item.quantity },
              $push: {
                stockHistory: {
                  type: 'adjustment',
                  quantity: item.quantity,
                  note: `Released reserved stock - Order ${order.orderId} abandoned timeout`,
                },
              },
            }
          );
        }
        console.log(`[CRON] Cancelled order ${order.orderId} and released stock.`);
      }

    } catch (error) {
      console.error('[CRON] Error during order expiration check:', error);
    }
  });
};

export default startOrderExpirationCron;
