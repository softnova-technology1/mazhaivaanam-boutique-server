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
    shortDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: '',
      maxlength: 4000,
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
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
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
      type: String,
      default: '',
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
    
    // Additional requested fields
    weightKg: { type: Number, default: 0.5, min: 0 }, // Weight in KG — used for shipping calc
    weight: { type: String, default: '' },
    pattern: { type: String, default: '' },
    pallu: { type: String, default: '' },
    sareeLength: { type: String, default: '' },
    blouseLength: { type: String, default: '' },
    blouse: { type: String, default: '' },
    height: { type: String, default: '' },
    washCare: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
    note: { type: String, default: '' },

    // ─── SKU & Pattern Identity ──────────────────────────────────
    sku: {
      type: String,
      unique: true,
      sparse: true,   // allows null for old products
      index: true,
    },
    normalizedName: {
      type: String,
      default: '',
      index: true,    // for fast pattern-grouping lookup
    },
    patternCode: {
      type: String,
      default: '',
      index: true,    // e.g. "EE-001"
    },
    patternSeq: {
      type: Number,
      default: 1,     // position within same pattern
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

    // Limited Offer timed entry
    limitedOfferEntry: {
      isActive:   { type: Boolean, default: false },
      section:    { type: Number, enum: [1, 2], default: 1 },
      offerLabel: { type: String, default: '' },
      startDate:  { type: Date, default: null },
      endDate:    { type: Date, default: null },
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

  next();
});

// Indexes for filtering & search
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ tag: 1 });
productSchema.index({ fabric: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ 'limitedOfferEntry.isActive': 1, 'limitedOfferEntry.endDate': 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
