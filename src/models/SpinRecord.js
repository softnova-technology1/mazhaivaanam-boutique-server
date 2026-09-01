import mongoose from 'mongoose';

const spinRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prize: { type: String, required: true },
    couponCode: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for quick daily lookup
spinRecordSchema.index({ user: 1, createdAt: -1 });

const SpinRecord = mongoose.model('SpinRecord', spinRecordSchema);
export default SpinRecord;
