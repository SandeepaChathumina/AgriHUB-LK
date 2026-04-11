/* eslint-env jest */
import httpMocks from 'node-mocks-http';
import { 
  createReview, 
  getReviewsForTarget, 
  moderateReview, 
  deleteReview 
} from '../reviewController.js';

import Review from '../../models/Review.js';
import AggregatedRating from '../../models/AggregatedRating.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// --- MOCK DEPENDENCIES ---
jest.mock('../../models/Review.js');
jest.mock('../../models/AggregatedRating.js');
jest.mock('../../models/Order.js');
jest.mock('../../models/User.js');
jest.mock('../../models/Product.js'); // Required because the controller imports it

describe('Review Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
  });

  describe('1. createReview', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        user: { _id: 'distributor_1', role: 'Distributor' },
        body: {
          targetType: 'Farmer',
          targetId: 'farmer_1',
          orderId: 'order_123',
          rating: 5,
          comment: 'Great produce!'
        }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      req.body.rating = undefined; // Remove a required field

      await createReview(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Missing required fields');
    });

    it('should return 403 if role combination is invalid (e.g., Distributor reviewing Distributor)', async () => {
      req.body.targetType = 'Distributor'; // Invalid for a Distributor to review

      await createReview(req, res);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('You cannot review');
    });

    it('should return 400 if order is not Delivered yet', async () => {
      // Mock Order that is still Pending, but includes the Product so it passes Auth checks
      const mockOrder = {
        _id: 'order_123',
        distributor: 'distributor_1',
        deliveryStatus: 'Pending',
        product: { farmer: 'farmer_1' } // <-- THIS FIXES THE 403 ERROR
      };
      
      mockOrder.populate = jest.fn().mockResolvedValue(mockOrder);
      Order.findById.mockResolvedValue(mockOrder);

      await createReview(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('can only review after the order is delivered');
    });

    it('should successfully create a review for a delivered order', async () => {
      // 1. Mock Order to be Delivered and owned by this Distributor
      const mockOrder = {
        _id: 'order_123',
        distributor: 'distributor_1',
        deliveryStatus: 'Delivered',
        product: { farmer: 'farmer_1' } // Matches targetId
      };
      // Important: Mock the populate method on the document instance itself
      mockOrder.populate = jest.fn().mockResolvedValue(mockOrder);
      Order.findById.mockResolvedValue(mockOrder);

      // 2. Mock that the review doesn't already exist
      Review.findOne.mockResolvedValue(null);

      // 3. Mock the Target User exists
      User.findById.mockResolvedValue({
        _id: 'farmer_1',
        role: 'Farmer'
      });

      // 4. Mock the Save action
      jest.spyOn(Review.prototype, 'save').mockResolvedValue(true);

      await createReview(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData().message).toContain('submitted successfully and pending');
      expect(Review.prototype.save).toHaveBeenCalled();
    });
  });

  describe('2. getReviewsForTarget', () => {
    it('should fetch, filter, and sort reviews correctly', async () => {
      req = httpMocks.createRequest({
        params: { targetType: 'Farmer', targetId: 'farmer_1' },
        query: { page: 1, limit: 10 }
      });

      // Mongoose Chain Mocking
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'rev_1', rating: 5 }])
      });

      Review.countDocuments.mockResolvedValue(1);
      AggregatedRating.findOne.mockResolvedValue({ averageRating: 5, totalReviews: 1 });

      await getReviewsForTarget(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(responseData.reviews.length).toBe(1);
      expect(responseData.stats.averageRating).toBe(5);
    });

    it('should return 400 for an invalid targetType', async () => {
      req = httpMocks.createRequest({
        params: { targetType: 'InvalidRole', targetId: '123' }
      });

      await getReviewsForTarget(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Invalid target type');
    });
  });

  describe('3. moderateReview (Admin Action)', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        params: { reviewId: 'rev_1' },
        body: { status: 'Approved' }
      });
    });

    it('should successfully approve a review and trigger rating aggregation', async () => {
      // 1. Mock finding the review to moderate
      const mockReview = {
        _id: 'rev_1',
        targetType: 'Farmer',
        targetId: 'farmer_1',
        save: jest.fn().mockResolvedValue(true)
      };
      Review.findById.mockResolvedValue(mockReview);

      // 2. Mock the internal `updateAggregatedRatings` dependencies
      // It searches for all approved reviews to calculate the new average
      Review.find.mockResolvedValue([
        { rating: 5, criteria: { productQuality: 5 } },
        { rating: 4, criteria: { productQuality: 4 } }
      ]);
      
      // Mock the aggregation update saving
      AggregatedRating.findOneAndUpdate.mockResolvedValue(true);

      await moderateReview(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockReview.moderationStatus).toBe('Approved');
      expect(mockReview.isPublished).toBe(true);
      expect(mockReview.save).toHaveBeenCalled();
      
      // Ensure the background aggregation was triggered
      expect(Review.find).toHaveBeenCalledWith(expect.objectContaining({
        targetType: 'Farmer',
        targetId: 'farmer_1',
        moderationStatus: 'Approved'
      }));
      expect(AggregatedRating.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('4. deleteReview (Admin Action)', () => {
    it('should delete a review and recalculate aggregate ratings', async () => {
      req = httpMocks.createRequest({
        params: { reviewId: 'rev_1' }
      });

      const mockReview = {
        _id: 'rev_1',
        targetType: 'Distributor',
        targetId: 'dist_1',
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      Review.findById.mockResolvedValue(mockReview);

      // Mock aggregation recalculation (returning empty array meaning 0 reviews left)
      Review.find.mockResolvedValue([]);
      AggregatedRating.findOneAndDelete.mockResolvedValue(true);

      await deleteReview(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockReview.deleteOne).toHaveBeenCalled();
      expect(AggregatedRating.findOneAndDelete).toHaveBeenCalled();
    });
  });
});