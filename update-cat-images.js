import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';

dotenv.config();

const updateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mapping = [
      { name: 'Everyday Elegance', url: '/Images/saree1.png' },
      { name: 'Festive Glow', url: '/Images/silk1.png' },
      { name: 'Style Studio', url: '/Images/fancy1.png' },
      { name: 'Black Magic', url: '/Images/black1.png' }
    ];

    for (let item of mapping) {
      const cat = await Category.findOne({ name: item.name });
      if (cat) {
        cat.image = { url: item.url, publicId: '' };
        await cat.save();
        console.log(`Updated ${item.name} with image ${item.url}`);
      }
    }
    
    console.log('Update complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateImages();
