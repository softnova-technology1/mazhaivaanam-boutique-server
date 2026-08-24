import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // null = no cap
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Check if coupon is currently valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Calculate discount for a given amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isValid()) return 0;
  if (orderAmount < this.minOrderAmount) return 0;

  let discount = 0;
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply max discount cap
  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  return Math.round(discount);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
