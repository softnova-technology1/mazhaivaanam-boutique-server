import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // To prevent CastError, check if it's a valid ObjectId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a dummy ID like 'prod-catalog-1', it won't have reviews in DB by this ID
      // We can try to look it up by slug or just return empty
      return successResponse(res, []);
    }

    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .lean();
    successResponse(res, reviews);
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { rating, text, name, location, photo } = req.body;
    const productId = req.params.productId;

    // Check if product exists (search by _id or slug/custom ID)
    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }
    if (!product) {
      // Fallback find first matching or create on active product
      product = await Product.findOne();
    }

    const review = await Review.create({
      product: product?._id || productId,
      user: req.user?._id || null,
      name: name || req.user?.fullName || req.user?.firstName || 'Valued Patron',
      location: location || 'Verified Patron',
      rating: Number(rating) || 5,
      text,
      photo: photo || '',
      isVerified: true,
      isApproved: true,
    });

    if (product) {
      await recalculateRating(product._id);
    }

    successResponse(res, review, 'Appraisal submitted successfully! ✨', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return errorResponse(res, 'Review not found', 404);

    await review.deleteOne();

    // Recalculate product rating
    await recalculateRating(review.product);

    successResponse(res, null, 'Review deleted');
  } catch (error) {
    next(error);
  }
};

// Admin: Approve review
export const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return errorResponse(res, 'Review not found', 404);

    review.isApproved = true;
    await review.save();

    // Recalculate product rating
    await recalculateRating(review.product);

    successResponse(res, review, 'Review approved');
  } catch (error) {
    next(error);
  }
};

// Admin: Get all pending reviews
export const getPendingReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('product', 'name slug images')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();
    successResponse(res, reviews);
  } catch (error) {
    next(error);
  }
};

// Helper: Recalculate product average rating
async function recalculateRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { averageRating: 0, reviewCount: 0 });
  }
}
