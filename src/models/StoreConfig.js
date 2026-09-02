import mongoose from 'mongoose';

/**
 * StoreConfig — Single DB document for global store fee settings.
 * Admin panel-la control பண்ணலாம்.
 * Uses singleton pattern (always one document with key: 'main').
 */
const storeConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // General Store Info
    storeName: { type: String, default: 'MAZHAI VAANAM' },
    email: { type: String, default: 'support@mazhaivaanam.com' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: '' },

    // Social Links
    facebookUrl: { type: String, default: 'https://www.facebook.com/profile.php?id=61569890920943' },
    instagramUrl: { type: String, default: 'https://www.instagram.com/mazhaivaanam' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com/@mazhaivaanam' },

    // Fees (configurable without redeploy)
    convenienceFee: { type: Number, default: 2 },
    giftWrapPrice: { type: Number, default: 499 },
  },
  { timestamps: true }
);

// Static helper — always fetch the one main config doc (or create default)
storeConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ key: 'main' });
  if (!config) {
    config = await this.create({ key: 'main' });
  }
  return config;
};

const StoreConfig = mongoose.model('StoreConfig', storeConfigSchema);
export default StoreConfig;
