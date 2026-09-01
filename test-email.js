import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './src/models/Order.js';
import User from './src/models/User.js';
import { sendOrderConfirmationEmail } from './src/utils/sendEmail.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const order = await Order.findOne({ paymentStatus: 'paid' }).sort({ createdAt: -1 });
  const user = await User.findById(order.user);
  
  console.log('Sending email...');
  const res = await sendOrderConfirmationEmail(user, order);
  console.log('Result:', res);
  mongoose.disconnect();
}
test();
