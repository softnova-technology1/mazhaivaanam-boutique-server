import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
    fabric: {
      type: String,
      required: [true, 'Fabric type is required'],
      enum: ['Pure Silk', 'Cotton', 'Tussar', 'Organza', 'Linen', 'Georgette', 'Chiffon', 'Chanderi'],
    },
    color: {
      name: { type: String, default: '' },
      hex: { type: String, default: '#000000' },
    },
    occasion: {
      type: String,
      enum: ['Wedding', 'Festival', 'Party Wear', 'Reception', 'Traditional', 'Casual', 'Bridal'],
      default: 'Traditional',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    mrpPrice: {
      type: Number,
      default: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    tag: {
      type: String,
      enum: ['BESTSELLER', 'NEW ARRIVAL', 'LIMITED EDITION', 'FESTIVAL CHOICE', null],
      default: null,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Discount fields
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', null],
        default: null,
      },
      value: { type: Number, default: 0 },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
      label: { type: String, default: '' },
    },

    // Pre-order fields
    isPreorder: {
      type: Boolean,
      default: false,
    },
    preorderDeposit: {
      type: Number,
      default: 0,
    },
    preorderProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    preorderWeaver: {
      type: String,
      default: '',
    },
    preorderEstimatedDays: {
      type: Number,
      default: 0,
    },
    preorderDiscount: {
      type: String,
      default: '',
    },

    // Product specifications
    specs: {
      fabricType: { type: String, default: '' },
      weave: { type: String, default: '' },
      zari: { type: String, default: '' },
      origin: { type: String, default: '' },
      weight: { type: String, default: '' },
      blousePiece: { type: String, default: '' },
      length: { type: String, default: '' },
      width: { type: String, default: '' },
      washCare: { type: String, default: '' },
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

// Generate slug before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  // Default mrpPrice to price * 1.15 if not set
  if (!this.mrpPrice || this.mrpPrice <= this.price) {
    this.mrpPrice = Math.round(this.price * 1.15);
  }
  next();
});

// Indexes for filtering & search
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ tag: 1 });
productSchema.index({ fabric: 1 });
productSchema.index({ occasion: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
