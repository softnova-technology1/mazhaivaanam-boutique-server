import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// DNS SRV Fix
dns.setServers(['8.8.8.8', '1.1.1.1']);

const cleanDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://softnovatech24:softnovatech24@cluster0.xz6g4.mongodb.net/?appName=Cluster0';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;

    // 1. Keep ONLY admin@mazhaivaanam.com in users collection
    const userDeleteResult = await db.collection('users').deleteMany({
      email: { $ne: 'admin@mazhaivaanam.com' },
    });
    console.log(`Cleared non-admin users. Removed: ${userDeleteResult.deletedCount} users. Retained: admin@mazhaivaanam.com`);

    // Ensure admin user role is 'admin'
    await db.collection('users').updateOne(
      { email: 'admin@mazhaivaanam.com' },
      { $set: { role: 'admin', isActive: true, isVerified: true } },
      { upsert: false }
    );

    // 2. Clear ALL dummy orders permanently
    const orderDeleteResult = await db.collection('orders').deleteMany({});
    console.log(`Cleared all orders. Removed: ${orderDeleteResult.deletedCount} orders.`);

    // 3. Clear ALL carts
    const cartDeleteResult = await db.collection('carts').deleteMany({});
    console.log(`Cleared all carts. Removed: ${cartDeleteResult.deletedCount} carts.`);

    // 4. Clear ALL wishlists
    const wishlistDeleteResult = await db.collection('wishlists').deleteMany({});
    console.log(`Cleared all wishlists. Removed: ${wishlistDeleteResult.deletedCount} wishlists.`);

    // 5. Clear ALL saved addresses
    const addressDeleteResult = await db.collection('addresses').deleteMany({});
    console.log(`Cleared all addresses. Removed: ${addressDeleteResult.deletedCount} addresses.`);

    // 6. Clear ALL contact inquiries
    const inquiryDeleteResult = await db.collection('contactinquiries').deleteMany({});
    console.log(`Cleared all contact inquiries. Removed: ${inquiryDeleteResult.deletedCount} inquiries.`);

    // 7. Clear ALL reviews
    const reviewDeleteResult = await db.collection('reviews').deleteMany({});
    console.log(`Cleared all reviews. Removed: ${reviewDeleteResult.deletedCount} reviews.`);

    // 8. Count Retained Data
    const prodCount = await db.collection('products').countDocuments();
    const catCount = await db.collection('categories').countDocuments();
    const invCount = await db.collection('inventories').countDocuments();
    const offerCount = await db.collection('limitedofferconfigs').countDocuments();
    const userCount = await db.collection('users').countDocuments();

    console.log('\n=============================================');
    console.log('✅ DATABASE CLEANUP COMPLETE & ACCURATE');
    console.log('=============================================');
    console.log(`• Retained Users: ${userCount} (ONLY admin@mazhaivaanam.com)`);
    console.log(`• Retained Products: ${prodCount} Sarees`);
    console.log(`• Retained Categories: ${catCount} Collections`);
    console.log(`• Retained Inventories: ${invCount} Warehouse Stocks`);
    console.log(`• Retained Offer Configs: ${offerCount}`);
    console.log('• Retained Orders: 0 (100% Clean state for real customer orders!)');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanDB();
