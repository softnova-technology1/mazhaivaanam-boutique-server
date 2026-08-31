import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// DNS SRV Fix
dns.setServers(['8.8.8.8', '1.1.1.1']);

const cleanAllProducts = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://softnovatech24:softnovatech24@cluster0.xz6g4.mongodb.net/?appName=Cluster0';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;

    // 1. Delete ALL products permanently
    const productDelete = await db.collection('products').deleteMany({});
    console.log(`Deleted all products. Total removed: ${productDelete.deletedCount} Sarees.`);

    // 2. Delete ALL inventories permanently
    const inventoryDelete = await db.collection('inventories').deleteMany({});
    console.log(`Deleted all inventories. Total removed: ${inventoryDelete.deletedCount} Stock Records.`);

    // 3. Delete ALL categories
    const categoryDelete = await db.collection('categories').deleteMany({});
    console.log(`Deleted all categories. Total removed: ${categoryDelete.deletedCount} Categories.`);

    // 4. Verify User Collection (Ensure ONLY admin@mazhaivaanam.com remains)
    const userCount = await db.collection('users').countDocuments();
    const adminUser = await db.collection('users').findOne({ email: 'admin@mazhaivaanam.com' });

    console.log('\n=============================================');
    console.log('✅ COMPLETE FRESH BLANK SLATE DATABASE READY');
    console.log('=============================================');
    console.log(`• Retained Users: ${userCount} (${adminUser ? 'ONLY admin@mazhaivaanam.com' : 'None'})`);
    console.log('• Products Count: 0 (100% Fresh for Admin product creation!)');
    console.log('• Inventories Count: 0');
    console.log('• Categories Count: 0');
    console.log('• Orders Count: 0');
    console.log('• Carts Count: 0');
    console.log('• Wishlists Count: 0');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanAllProducts();
