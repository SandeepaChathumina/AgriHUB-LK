// controllers/reviewController.js
import Review from '../models/Review.js';
import AggregatedRating from '../models/AggregatedRating.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Helper function to update aggregated ratings
const updateAggregatedRatings = async (targetType, targetId) => {
  const reviews = await Review.find({
    targetType,
    targetId,
    moderationStatus: 'Approved',
    isPublished: true
  });
  
  if (reviews.length === 0) {
    await AggregatedRating.findOneAndDelete({ targetType, targetId });
    return;
  }
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => distribution[r.rating]++);
  
  let farmerSpecific = {};
  let transporterSpecific = {};
  let distributorSpecific = {};
  
  if (targetType === 'Farmer') {
    const productQualitySum = reviews.reduce((sum, r) => sum + (r.criteria?.productQuality || 0), 0);
    const freshnessSum = reviews.reduce((sum, r) => sum + (r.criteria?.freshness || 0), 0);
    const packagingSum = reviews.reduce((sum, r) => sum + (r.criteria?.packaging || 0), 0);
    const count = reviews.length;
    
    farmerSpecific = {
      averageProductQuality: count ? productQualitySum / count : 0,
      averageFreshness: count ? freshnessSum / count : 0,
      averagePackaging: count ? packagingSum / count : 0
    };
  }
  
  if (targetType === 'Transporter') {
    const timelinessSum = reviews.reduce((sum, r) => sum + (r.criteria?.timeliness || 0), 0);
    const vehicleConditionSum = reviews.reduce((sum, r) => sum + (r.criteria?.vehicleCondition || 0), 0);
    const professionalismSum = reviews.reduce((sum, r) => sum + (r.criteria?.professionalism || 0), 0);
    const count = reviews.length;
    
    transporterSpecific = {
      averageTimeliness: count ? timelinessSum / count : 0,
      averageVehicleCondition: count ? vehicleConditionSum / count : 0,
      averageProfessionalism: count ? professionalismSum / count : 0
    };
  }
  
  if (targetType === 'Distributor') {
    const paymentReliabilitySum = reviews.reduce((sum, r) => sum + (r.criteria?.paymentReliability || 0), 0);
    const communicationSum = reviews.reduce((sum, r) => sum + (r.criteria?.communication || 0), 0);
    const wouldWorkAgainCount = reviews.filter(r => r.criteria?.wouldWorkAgain === true).length;
    const count = reviews.length;
    
    distributorSpecific = {
      averagePaymentReliability: count ? paymentReliabilitySum / count : 0,
      averageCommunication: count ? communicationSum / count : 0,
      wouldWorkAgainPercentage: count ? (wouldWorkAgainCount / count) * 100 : 0
    };
  }
  
  await AggregatedRating.findOneAndUpdate(
    { targetType, targetId },
    {
      targetType,
      targetId,
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      farmerSpecific,
      transporterSpecific,
      distributorSpecific
    },
    { upsert: true, new: true }
  );
};

// 1. Create a review
export const createReview = async (req, res) => {
  try {
    const { targetType, targetId, orderId, rating, title, comment, criteria, images } = req.body;
    const reviewerId = req.user._id;
    const reviewerRole = req.user.role;
    
    // Validation
    if (!targetType || !targetId || !orderId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if targetType is valid for this reviewer
    const validReviewCombinations = {
      Distributor: ['Farmer', 'Transporter'],
      Farmer: ['Distributor'],
      Transporter: ['Distributor']
    };
    
    if (!validReviewCombinations[reviewerRole]?.includes(targetType)) {
      return res.status(403).json({
        success: false,
        message: `You cannot review ${targetType}s as a ${reviewerRole}`
      });
    }
    
    // Verify the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify reviewer is associated with the order
    let isAuthorized = false;
    
    if (reviewerRole === 'Distributor') {
      isAuthorized = order.distributor.toString() === reviewerId.toString();
      
      if (targetType === 'Farmer') {
        await order.populate('product');
        if (!order.product || order.product.farmer?.toString() !== targetId) {
          return res.status(403).json({
            success: false,
            message: 'You can only review the farmer who sold you this product'
          });
        }
      }
      
      if (targetType === 'Transporter') {
        if (!order.transporter || order.transporter.toString() !== targetId) {
          return res.status(403).json({
            success: false,
            message: 'You can only review the transporter who delivered this order'
          });
        }
      }
    }
    
    if (reviewerRole === 'Farmer') {
      await order.populate('product');
      isAuthorized = order.product?.farmer?.toString() === reviewerId.toString();
      
      if (targetType === 'Distributor') {
        if (order.distributor?.toString() !== targetId) {
          return res.status(403).json({
            success: false,
            message: 'You can only review the distributor who bought from you'
          });
        }
      }
    }
    
    if (reviewerRole === 'Transporter') {
      isAuthorized = order.transporter?.toString() === reviewerId.toString();
      
      if (targetType === 'Distributor') {
        if (order.distributor?.toString() !== targetId) {
          return res.status(403).json({
            success: false,
            message: 'You can only review the distributor you delivered for'
          });
        }
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this target for this order'
      });
    }
    
    // Check if order is eligible for review
    if (order.deliveryStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `You can only review after the order is delivered. Current status: ${order.deliveryStatus}`
      });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      targetType,
      targetId,
      order: orderId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this target for this order'
      });
    }
    
    // Verify target exists and role matches
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }
    
    if (target.role !== targetType) {
      return res.status(400).json({
        success: false,
        message: `Target user is a ${target.role}, not a ${targetType}`
      });
    }
    
    // Create review
    const review = new Review({
      reviewer: reviewerId,
      reviewerRole,
      targetType,
      targetId,
      order: orderId,
      rating,
      title: title || '',
      comment,
      criteria: criteria || {},
      images: images || [],
      isVerifiedPurchase: true,
      moderationStatus: 'Approved',
      isPublished: true
    });
    
    await review.save();
    
    await updateAggregatedRatings(targetType, targetId);
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// 2. Get reviews for a target
export const getReviewsForTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating } = req.query;
    
    if (!['Farmer', 'Distributor', 'Transporter'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }
    
    const filter = {
      targetType,
      targetId,
      moderationStatus: 'Approved',
      isPublished: true
    };
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1 };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(filter)
      .populate('reviewer', 'fullName email')
      .populate('order', 'createdAt totalPrice')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    const stats = await AggregatedRating.findOne({ targetType, targetId });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats: stats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      reviews
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// 3. Get reviews written by logged-in user
export const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('targetId', 'fullName businessName companyName email')
      .populate('order', 'createdAt totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ reviewer: req.user._id });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews
    });
    
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// 4. Get pending reviews (orders eligible for review)
export const getPendingReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let filter = { deliveryStatus: 'Delivered' };
    
    if (userRole === 'Distributor') {
      filter.distributor = userId;
    } else if (userRole === 'Farmer') {
      const products = await Product.find({ farmer: userId }).select('_id');
      const productIds = products.map(p => p._id);
      filter.product = { $in: productIds };
    } else if (userRole === 'Transporter') {
      filter.transporter = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only Distributors, Farmers, and Transporters can access pending reviews'
      });
    }
    
    const orders = await Order.find(filter)
      .populate('product', 'productName farmer')
      .populate('distributor', 'fullName email')
      .populate('transporter', 'companyName fullName')
      .sort({ createdAt: -1 });
    
    const ordersWithReviewStatus = await Promise.all(orders.map(async (order) => {
      const reviewableTargets = [];
      
      if (userRole === 'Distributor') {
        // Can review farmer
        if (order.product && order.product.farmer) {
          const farmerId = order.product.farmer._id || order.product.farmer;
          const farmerName = order.product.farmer.fullName || 'Farmer';
          
          const farmerReview = await Review.findOne({
            reviewer: userId,
            targetType: 'Farmer',
            order: order._id
          });
          
          reviewableTargets.push({
            type: 'Farmer',
            targetId: farmerId,
            targetName: farmerName,
            isReviewed: !!farmerReview,
            reviewId: farmerReview?._id
          });
        }
        
        // Can review transporter
        if (order.transporter) {
          const transporterId = order.transporter._id || order.transporter;
          const transporterName = order.transporter.companyName || order.transporter.fullName || 'Transporter';
          
          const transporterReview = await Review.findOne({
            reviewer: userId,
            targetType: 'Transporter',
            order: order._id
          });
          
          reviewableTargets.push({
            type: 'Transporter',
            targetId: transporterId,
            targetName: transporterName,
            isReviewed: !!transporterReview,
            reviewId: transporterReview?._id
          });
        }
      }
      
      if (userRole === 'Farmer' && order.distributor) {
        const distributorReview = await Review.findOne({
          reviewer: userId,
          targetType: 'Distributor',
          order: order._id
        });
        
        reviewableTargets.push({
          type: 'Distributor',
          targetId: order.distributor._id || order.distributor,
          targetName: order.distributor.fullName || 'Distributor',
          isReviewed: !!distributorReview,
          reviewId: distributorReview?._id
        });
      }
      
      if (userRole === 'Transporter' && order.distributor) {
        const distributorReview = await Review.findOne({
          reviewer: userId,
          targetType: 'Distributor',
          order: order._id
        });
        
        reviewableTargets.push({
          type: 'Distributor',
          targetId: order.distributor._id || order.distributor,
          targetName: order.distributor.fullName || 'Distributor',
          isReviewed: !!distributorReview,
          reviewId: distributorReview?._id
        });
      }
      
      return {
        order: {
          _id: order._id,
          createdAt: order.createdAt,
          totalPrice: order.totalPrice,
          productName: order.product?.productName || 'Product'
        },
        reviewableTargets: reviewableTargets.filter(t => t.targetId)
      };
    }));
    
    const pendingOrders = ordersWithReviewStatus.filter(
      order => order.reviewableTargets.some(t => !t.isReviewed)
    );
    
    res.status(200).json({
      success: true,
      count: pendingOrders.length,
      orders: pendingOrders
    });
    
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reviews',
      error: error.message
    });
  }
};

// 5. Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, criteria, images } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }
    
    if (review.response && review.response.text) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update review after target has responded'
      });
    }
    
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (criteria) review.criteria = { ...review.criteria, ...criteria };
    if (images) review.images = images;
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// 6. Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (review.helpfulUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You already marked this review as helpful'
      });
    }
    
    review.helpfulUsers.push(userId);
    review.helpfulCount++;
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Marked as helpful',
      helpfulCount: review.helpfulCount
    });
    
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

// 7. Respond to review
export const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { responseText } = req.body;
    const userId = req.user._id;
    
    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (review.targetId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewed party can respond'
      });
    }
    
    review.response = {
      text: responseText.trim(),
      respondedBy: userId,
      respondedAt: new Date()
    };
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review
    });
    
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to review',
      error: error.message
    });
  }
};

// 8. Admin: Get all reviews for moderation
export const getReviewsForModeration = async (req, res) => {
  try {
    const { status = 'Pending', page = 1, limit = 20, targetType } = req.query;
    
    const filter = { moderationStatus: status };
    if (targetType) filter.targetType = targetType;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(filter)
      .populate('reviewer', 'fullName email role')
      .populate('targetId', 'fullName businessName email')
      .populate('order', 'createdAt totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews
    });
    
  } catch (error) {
    console.error('Get reviews for moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// 9. Admin: Moderate review
export const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, note } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected'
      });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    review.moderationStatus = status;
    if (note) review.moderationNote = note;
    
    if (status === 'Rejected') {
      review.isPublished = false;
    } else {
      review.isPublished = true;
    }
    
    await review.save();
    
    if (status === 'Approved') {
      await updateAggregatedRatings(review.targetType, review.targetId);
    } else if (status === 'Rejected') {
      await updateAggregatedRatings(review.targetType, review.targetId);
    }
    
    res.status(200).json({
      success: true,
      message: `Review ${status.toLowerCase()} successfully`,
      review
    });
    
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moderating review',
      error: error.message
    });
  }
};

// 10. Admin: Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const targetType = review.targetType;
    const targetId = review.targetId;
    
    await review.deleteOne();
    
    await updateAggregatedRatings(targetType, targetId);
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// 11. Get review statistics for dashboard
export const getReviewStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let stats = {};
    
    if (userRole === 'Farmer') {
      const aggregated = await AggregatedRating.findOne({
        targetType: 'Farmer',
        targetId: userId
      });
      
      stats = {
        totalReviews: aggregated?.totalReviews || 0,
        averageRating: aggregated?.averageRating || 0,
        ratingDistribution: aggregated?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        productQuality: aggregated?.farmerSpecific?.averageProductQuality || 0,
        freshness: aggregated?.farmerSpecific?.averageFreshness || 0,
        packaging: aggregated?.farmerSpecific?.averagePackaging || 0
      };
    }
    
    if (userRole === 'Transporter') {
      const aggregated = await AggregatedRating.findOne({
        targetType: 'Transporter',
        targetId: userId
      });
      
      stats = {
        totalReviews: aggregated?.totalReviews || 0,
        averageRating: aggregated?.averageRating || 0,
        ratingDistribution: aggregated?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeliness: aggregated?.transporterSpecific?.averageTimeliness || 0,
        vehicleCondition: aggregated?.transporterSpecific?.averageVehicleCondition || 0,
        professionalism: aggregated?.transporterSpecific?.averageProfessionalism || 0
      };
    }
    
    if (userRole === 'Distributor') {
      const aggregated = await AggregatedRating.findOne({
        targetType: 'Distributor',
        targetId: userId
      });
      
      stats = {
        totalReviews: aggregated?.totalReviews || 0,
        averageRating: aggregated?.averageRating || 0,
        ratingDistribution: aggregated?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        paymentReliability: aggregated?.distributorSpecific?.averagePaymentReliability || 0,
        communication: aggregated?.distributorSpecific?.averageCommunication || 0,
        wouldWorkAgainPercentage: aggregated?.distributorSpecific?.wouldWorkAgainPercentage || 0
      };
    }
    
    res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};