import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mazhaivaanam')
  .then(async () => {
    const db = mongoose.connection.db;
    const result = await db.collection('products').updateMany({ preorderDiscount: '10%' }, { $set: { preorderDiscount: '' } });
    console.log('Updated ' + result.modifiedCount + ' products.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
