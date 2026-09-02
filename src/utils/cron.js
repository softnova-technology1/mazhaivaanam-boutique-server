import Product from '../models/Product.js';

export const startCronJobs = () => {
  console.log('[Cron] Initializing background jobs...');
  
  // Run every 1 minute
  setInterval(async () => {
    try {
      const now = new Date();
      // Find products where isScheduled is true and scheduledAt is past or present
      const result = await Product.updateMany(
        { 
          isScheduled: true, 
          scheduledAt: { $lte: now } 
        },
        { 
          $set: { 
            isScheduled: false, 
            scheduledAt: null, 
            isActive: true 
          } 
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron] Published ${result.modifiedCount} scheduled product(s) at ${now.toISOString()}`);
      }
    } catch (error) {
      console.error('[Cron] Error running product scheduler:', error);
    }
  }, 60 * 1000);
};
