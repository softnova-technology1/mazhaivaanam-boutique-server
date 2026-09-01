import mongoose from 'mongoose';

const fabricSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const Fabric = mongoose.model('Fabric', fabricSchema);
export default Fabric;
