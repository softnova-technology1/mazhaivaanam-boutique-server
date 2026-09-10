import mongoose from 'mongoose';

async function fix() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://softnovatech24:softnovatech24@cluster0.xz6g4.mongodb.net/?appName=Cluster0');
    console.log('Connected. Updating limitedofferconfigs...');
    
    // Set isActive to false for all documents in this collection
    const result = await mongoose.connection.db.collection('limitedofferconfigs').updateOne({}, { $set: { isActive: false } });
    
    console.log('Update result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
