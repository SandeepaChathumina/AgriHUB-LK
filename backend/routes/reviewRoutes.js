// routes/reviewRoutes.js
import express from 'express';
import {
  createReview,
  getReviewsForTarget,
  getMyReviews,
  getPendingReviews,
  updateReview,
  markHelpful,
  respondToReview,
  getReviewsForModeration,
  moderateReview,
  deleteReview,
  getReviewStats
} from '../controllers/reviewController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get reviews for a specific target (Farmer/Distributor/Transporter)
router.get('/target/:targetType/:targetId', getReviewsForTarget);

// ==================== PROTECTED ROUTES (All logged-in users) ====================
router.use(protect);

// Get my own reviews
router.get('/my-reviews', getMyReviews);

// Get pending reviews (orders eligible for review)
router.get('/pending', getPendingReviews);

// Get my review statistics
router.get('/stats', getReviewStats);

// Create a review
router.post('/', createReview);

// Update my review
router.put('/:reviewId', updateReview);

// Mark review as helpful
router.patch('/:reviewId/helpful', markHelpful);

// Respond to review (for the target)
router.post('/:reviewId/respond', respondToReview);

// ==================== ADMIN ROUTES ====================
// Get reviews for moderation
router.get('/admin/moderation', authorizeRoles('Admin'), getReviewsForModeration);

// Moderate review (approve/reject)
router.patch('/admin/:reviewId/moderate', authorizeRoles('Admin'), moderateReview);

// Delete review
router.delete('/admin/:reviewId', authorizeRoles('Admin'), deleteReview);

export default router;