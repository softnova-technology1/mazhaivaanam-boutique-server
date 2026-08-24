import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    totalStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
    stockHistory: [
      {
        type: {
          type: String,
          enum: ['restock', 'sale', 'return', 'adjustment', 'reservation', 'release'],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        note: {
          type: String,
          default: '',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: available stock
inventorySchema.virtual('availableStock').get(function () {
  return Math.max(0, this.totalStock - this.reserved - this.sold);
});

// Virtual: is low stock
inventorySchema.virtual('isLowStock').get(function () {
  return this.availableStock <= this.lowStockThreshold;
});

// Virtual: is out of stock
inventorySchema.virtual('isOutOfStock').get(function () {
  return this.availableStock <= 0;
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
