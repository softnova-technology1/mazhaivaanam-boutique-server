import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        // Snapshot fields — preserved even if product changes later
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        fabric: { type: String, default: '' },
        category: { type: String, default: '' },
      },
    ],

    // Shipping address snapshot
    shippingAddress: {
      fullName: { type: String, required: true },
      addressLine: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pinCode: { type: String, default: '' },
      phone: { type: String, required: true },
    },
    deliveryMode: {
      type: String,
      enum: ['express', 'standard', 'pickup'],
      default: 'standard',
    },

    // Gift options
    giftPackaging: {
      type: Boolean,
      default: false,
    },
    giftMessage: {
      type: String,
      default: '',
      maxlength: 500,
    },

    // Pricing snapshot at time of order
    mrpTotal: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    giftPackCharge: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    totalSavings: { type: Number, default: 0 },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },

    // Order tracking
    status: {
      type: String,
      enum: [
        'PROCESSING',
        'CONFIRMED',
        'SHIPPED',
        'IN TRANSIT',
        'OUT FOR DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ],
      default: 'PROCESSING',
      index: true,
    },
    trackingNumber: { type: String, default: '' },
    courier: { type: String, default: '' },
    statusHistory: [
      {
        status: { type: String, required: true },
        location: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    estimatedDelivery: { type: Date, default: null },

    // Pre-order specific
    isPreorder: { type: Boolean, default: false },
    preorderStatus: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Index for order history queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
