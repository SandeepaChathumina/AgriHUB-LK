/* eslint-env jest */
import httpMocks from 'node-mocks-http';

// --- CRITICAL FIX FOR STRIPE ERROR ---
// We mock the 'stripe' package itself. This stops paymentController.js 
// from crashing when process.env.STRIPE_SECRET_KEY is undefined during tests.
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({}));
});

import { 
  placeOrder, 
  getMyOrders, 
  verifyPayment, 
  acceptOrderByFarmer 
} from '../orderController.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { getUSDPrice } from '../../utils/currencyConverter.js';
import * as paymentController from '../paymentController.js';

// --- MOCK DEPENDENCIES ---
jest.mock('../../models/Order.js');
jest.mock('../../models/Product.js');
jest.mock('../../utils/currencyConverter.js');
jest.mock('../paymentController.js');

describe('Order Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = httpMocks.createResponse();
    req = httpMocks.createRequest({
      user: { _id: 'user_distributor_123', role: 'Distributor' }
    });
  });

  describe('1. placeOrder', () => {
    it('should return 400 if product ID is missing', async () => {
      req.body = { quantity: 5, deliveryAddress: { addressLine: '123 Main', city: 'Colombo' } };

      await placeOrder(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Product ID is required');
    });

    it('should return 400 if stock is insufficient', async () => {
      req.body = { 
        productId: 'prod_123', 
        quantity: 100, // Requesting 100
        deliveryAddress: { addressLine: '123 Main', city: 'Colombo' } 
      };

      // Mock DB: Product only has 10 in stock
      Product.findById.mockResolvedValue({ _id: 'prod_123', price: 100, quantity: 10 });

      await placeOrder(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Insufficient stock');
    });

    it('should successfully create an order and return a Stripe URL', async () => {
      req.body = { 
        productId: 'prod_123', 
        quantity: 2, 
        deliveryAddress: { addressLine: '123 Main', city: 'Colombo' } 
      };

      // Mock Product with plenty of stock
      Product.findById.mockResolvedValue({ _id: 'prod_123', price: 500, quantity: 50 });
      getUSDPrice.mockResolvedValue(3.50);

      // Mock Stripe Session Creation
      paymentController.createStripeSession.mockResolvedValue({
        id: 'stripe_sess_999',
        url: 'https://checkout.stripe.com/pay/999'
      });

      // Mock Mongoose Save (Because we use 'new Order()')
      jest.spyOn(Order.prototype, 'save').mockResolvedValue(true);

      await placeOrder(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(201);
      expect(paymentController.createStripeSession).toHaveBeenCalled();
      expect(responseData.checkoutUrl).toBe('https://checkout.stripe.com/pay/999');
      
      // Instead of checking the empty response, check if the fake DB was given the right math!
      expect(Order).toHaveBeenCalledWith(expect.objectContaining({
        totalPrice: 1000,
        quantity: 2
      }));
    });
  });

  describe('2. getMyOrders', () => {
    it('should fetch paginated orders for the logged-in distributor', async () => {
      req.query = { page: 1, limit: 10 };

      // Mock Chained DB call: Order.find().populate().sort().skip().limit()
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'order_1', totalPrice: 1000 }])
      });

      Order.countDocuments.mockResolvedValue(1); // 1 total order

      await getMyOrders(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(responseData.total).toBe(1);
      expect(responseData.orders.length).toBe(1);
    });
  });

  describe('3. verifyPayment (Stripe Redirects)', () => {
    it('should redirect to error if session_id is missing', async () => {
      req.query = {}; // No session_id

      await verifyPayment(req, res);

      expect(res.statusCode).toBe(302); // 302 is the HTTP status for Redirect
      expect(res._getRedirectUrl()).toContain('reason=missing_session');
    });

    it('should deduct stock, mark as paid, and redirect to success on valid payment', async () => {
      req.query = { session_id: 'valid_session_123' };

      // 1. Mock Stripe Verification
      paymentController.verifyStripeSession.mockResolvedValue({
        payment_status: 'paid',
        metadata: { orderId: 'order_123' }
      });

      // 2. Mock finding the Order
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          paymentStatus: 'unpaid',
          quantity: 5,
          product: { _id: 'prod_123' }
        })
      });

      // 3. Mock finding the Product (to deduct stock)
      const mockProduct = {
        _id: 'prod_123',
        quantity: 20,
        totalSold: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      Product.findById.mockResolvedValue(mockProduct);

      // 4. Mock updating the order status
      Order.findByIdAndUpdate.mockResolvedValue(true);

      await verifyPayment(req, res);

      // Check if stock was actually deducted!
      expect(mockProduct.quantity).toBe(15); // Started with 20, bought 5
      expect(mockProduct.totalSold).toBe(5);
      expect(mockProduct.save).toHaveBeenCalled();

      // Check if order was updated to paid
      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith('order_123', expect.objectContaining({
        paymentStatus: 'paid',
        status: 'Awaiting Farmer Approval'
      }));

      // Check redirection
      expect(res.statusCode).toBe(302);
      expect(res._getRedirectUrl()).toContain('payment=success');
    });
  });

  describe('4. acceptOrderByFarmer', () => {
    it('should return 403 if someone other than the product owner tries to accept', async () => {
      req.params = { id: 'order_123' };
      req.user = { _id: 'hacker_farmer_999' }; // Different user ID

      // Mock finding an order that belongs to a different farmer
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          product: { farmer: 'real_farmer_111' } // IDs don't match
        })
      });

      await acceptOrderByFarmer(req, res);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('Not authorized');
    });

    it('should return 200 and update status when valid farmer accepts a paid order', async () => {
      req.params = { id: 'order_123' };
      req.user = { _id: 'real_farmer_111' };

      const mockOrder = {
        _id: 'order_123',
        paymentStatus: 'paid',
        status: 'Awaiting Farmer Approval',
        product: { farmer: 'real_farmer_111' },
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await acceptOrderByFarmer(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockOrder.status).toBe('Confirmed');
      expect(mockOrder.deliveryStatus).toBe('Requested');
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });
});