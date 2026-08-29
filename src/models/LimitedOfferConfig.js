import mongoose from 'mongoose';

const limitedOfferConfigSchema = new mongoose.Schema(
  {
    heroSection: {
      badgeText: { type: String, default: 'Limited Exclusive Offer' },
      title: { type: String, default: 'Exclusive Offers,' },
      titleItalic: { type: String, default: 'Limited Time' },
      subtitle: { type: String, default: 'Enjoy special prices on selected sarees for a limited period. Elevate your wardrobe with premium collections while these exclusive offers last.' },
      bgImage: { type: String, default: '/Images/limited.png' },
      primaryCtaText: { type: String, default: 'EXPLORE COLLECTION' },
      secondaryCtaText: { type: String, default: 'OUR HERITAGE' },
    },
    timerSection: {
      badgeText: { type: String, default: 'Time is running out' },
      title: { type: String, default: 'The Grand Gala Sale' },
      description: { type: String, default: 'Our most prestigious annual celebration ends soon. Secure your heritage pieces today before they return to the vault.' },
      endDate: { type: Date, default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    },
    featuredDuoSection: {
      badgeText: { type: String, default: 'Curated Festival Duo' },
      heading: { type: String, default: 'The Heritage Gift' },
      subHeading: { type: String, default: 'Buy 2 Sarees, Get 1 Free' },
      description: { type: String, default: 'Embrace the timeless tradition of gifting. Choose from our exquisite hand-woven silk collections and receive a complimentary heritage piece as a symbol of our festive gratitude.' },
      image: { type: String, default: '/Images/heritage.png' },
      ctaText: { type: String, default: 'Explore Collection' },
    },
    offerProductsSection: {
      badgeText: { type: String, default: 'Festive Deals' },
      heading: { type: String, default: 'Exclusive Offers' },
      productTag: { type: String, default: 'LIMITED OFFER' },
    },
    eligibleGallerySection: {
      badgeText: { type: String, default: 'Eligible Selection' },
      heading: { type: String, default: 'The Buy 2 Get 1 Gallery' },
    },
    curationOfJoySection: {
      badgeText: { type: String, default: 'Curation of Joy' },
      heading: { type: String, default: 'Bespoke Offer Tiers' },
      cards: [
        {
          title: { type: String, default: 'Diwali Offers' },
          discountBadge: { type: String, default: 'UP TO 40%' },
          image: { type: String, default: '/Images/diwali.png' },
          linkTab: { type: String, default: 'catalog' },
        },
        {
          title: { type: String, default: 'Bridal Offers' },
          discountBadge: { type: String, default: '20% OFF' },
          image: { type: String, default: '/Images/bridal.png' },
          linkTab: { type: String, default: 'catalog' },
        },
        {
          title: { type: String, default: 'Combo Set' },
          discountBadge: { type: String, default: 'SAVE 5K' },
          image: { type: String, default: '/Images/wedding.png' },
          linkTab: { type: String, default: 'catalog' },
        },
      ],
    },
    spinningWheelSection: {
      title: { type: String, default: 'Festival Lucky Draw' },
      description: { type: String, default: 'Spin the heritage wheel for a chance to win exclusive gift cards, artisan blouses, or a signature silk saree from our royal vault.' },
      bulletPoints: {
        type: [String],
        default: [
          'Grand Prize: Royal Banarasi Saree',
          'Gift Cards worth ₹ 10,000',
          'Artisan Blouse Customizations',
        ],
      },
      prizes: {
        type: [String],
        default: [
          'Premium Saree',
          '10% Discount',
          'Free Styling',
          'Surprise Box',
          'Artisan Blouse',
          'Free Shipping',
        ],
      },
    },
  },
  { timestamps: true }
);

const LimitedOfferConfig = mongoose.model('LimitedOfferConfig', limitedOfferConfigSchema);
export default LimitedOfferConfig;
