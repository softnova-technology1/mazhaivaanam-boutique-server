const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Category = require('./src/models/Category.js').default;
  const Product = require('./src/models/Product.js').default;
  const oldCat = await Category.findOne({ name: 'Every Day Elegance' });
  let newCat = await Category.findOne({ name: 'Everyday Elegance' });
  
  if (!newCat) {
    newCat = await Category.create({ name: 'Everyday Elegance' });
  }

  if (oldCat) {
    const res = await Product.updateMany({ category: oldCat._id }, { $set: { category: newCat._id } });
    console.log('Moved ' + res.modifiedCount + ' products.');
    await Category.deleteOne({ _id: oldCat._id });
    console.log('Deleted old category');
  } else {
    console.log('Could not find old category');
  }
  process.exit(0);
});
