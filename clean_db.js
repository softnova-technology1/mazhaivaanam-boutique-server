import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();
async function cleanMockImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Product.updateMany(
    { 'images.url': '/Images/saree1.png' },
    { $set: { images: [] } }
  );
  console.log('Cleaned mock images:', result);
  mongoose.disconnect();
}
cleanMockImages().catch(console.error);
   