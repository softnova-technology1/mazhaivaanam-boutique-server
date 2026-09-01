import mongoose from 'mongoose';

const offerSectionSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    slot:        { type: Number, enum: [1, 2], required: true },
    startDate:   { type: Date, default: null },
    endDate:     { type: Date, required: true },
    isActive:    { type: Boolean, default: true },
    productIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

offerSectionSchema.index({ slot: 1, isActive: 1, endDate: 1 });

const OfferSection = mongoose.model('OfferSection', offerSectionSchema);
export default OfferSection;
