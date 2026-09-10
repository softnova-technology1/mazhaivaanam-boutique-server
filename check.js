import mongoose from 'mongoose';
import LimitedOfferConfig from './src/models/LimitedOfferConfig.js';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mazhaivaanam_boutique');
  const doc = await LimitedOfferConfig.findOne();
  console.log('--- DB CONFIG ---');
  console.log('isActive:', doc?.isActive);
  process.exit(0);
}
check();
