/* eslint-env jest */
import Stripe from 'stripe';
import { createStripeSession, verifyStripeSession } from '../paymentController.js';

// --- BULLETPROOF STRIPE MOCK ---
// We define the mock functions completely inside the block so JavaScript
// cannot mess up the loading order, then attach them to the default export.
jest.mock('stripe', () => {
  const mockCreateFn = jest.fn();
  const mockRetrieveFn = jest.fn();

  const MockedStripe = jest.fn(() => ({
    checkout: {
      sessions: {
        create: mockCreateFn,
        retrieve: mockRetrieveFn,
      },
    },
  }));

  // Expose the mock functions so our test file can verify them
  MockedStripe._mockCreate = mockCreateFn;
  MockedStripe._mockRetrieve = mockRetrieveFn;

  return {
    __esModule: true,
    default: MockedStripe
  };
});

describe('Payment Controller Unit Tests', () => {
  // Grab the exact instances of the mocks we created above
  const mockCreate = Stripe._mockCreate;
  const mockRetrieve = Stripe._mockRetrieve;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKEND_URL = 'http://localhost:3000';
  });

  describe('1. createStripeSession', () => {
    const mockOrder = {
      _id: 'order_123',
      quantity: 50
    };

    const mockProduct = {
      productName: 'Organic Carrots',
      price: 200 // LKR
    };

    it('should successfully create a Stripe checkout session', async () => {
      const mockSessionResponse = {
        id: 'stripe_session_999',
        url: 'https://checkout.stripe.com/pay/999'
      };
      mockCreate.mockResolvedValue(mockSessionResponse);

      const result = await createStripeSession(mockOrder, mockProduct);

      expect(result).toEqual(mockSessionResponse);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      
      const stripeArguments = mockCreate.mock.calls[0][0];
      expect(stripeArguments.line_items[0].price_data.product_data.name).toBe('Organic Carrots');
      expect(stripeArguments.line_items[0].price_data.unit_amount).toBe(20000); 
      expect(stripeArguments.line_items[0].quantity).toBe(50);
      expect(stripeArguments.metadata.orderId).toBe('order_123');
    });

    it('should throw an error if the Stripe API fails', async () => {
      mockCreate.mockRejectedValue(new Error('Stripe is down'));

      await expect(createStripeSession(mockOrder, mockProduct))
        .rejects
        .toThrow('Failed to create payment session');
    });
  });

  describe('2. verifyStripeSession', () => {
    it('should throw an error if no session ID is provided', async () => {
      await expect(verifyStripeSession(null))
        .rejects
        .toThrow('Payment verification failed');
      
      expect(mockRetrieve).not.toHaveBeenCalled();
    });

    it('should successfully retrieve a session from Stripe', async () => {
      const mockRetrievedSession = {
        id: 'sess_123',
        payment_status: 'paid'
      };
      mockRetrieve.mockResolvedValue(mockRetrievedSession);

      const result = await verifyStripeSession('sess_123');

      expect(result).toEqual(mockRetrievedSession);
      expect(mockRetrieve).toHaveBeenCalledWith('sess_123');
    });

    it('should throw a verification error if Stripe retrieval fails', async () => {
      mockRetrieve.mockRejectedValue(new Error('Invalid Session ID'));

      await expect(verifyStripeSession('invalid_sess_id'))
        .rejects
        .toThrow('Payment verification failed');
    });
  });
});