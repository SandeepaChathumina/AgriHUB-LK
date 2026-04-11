/* eslint-env jest */
import httpMocks from 'node-mocks-http';
import { 
  getAvailableOrders, 
  createTrip, 
  updateTripStatus, 
  getTripStats,
  acceptRequest
} from '../tripController.js';

import Trip from '../../models/Trip.js';
import Order from '../../models/Order.js';
import Vehicle from '../../models/Vehicle.js';
import Transporter from '../../models/Transporter.js';

describe('Trip Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
    
    // Intercept the Trip prototype methods used during new Trip() creation
    jest.spyOn(Trip.prototype, 'addTimelineEvent').mockImplementation(() => {});
    jest.spyOn(Trip.prototype, 'save').mockResolvedValue(true);
    jest.spyOn(Trip.prototype, 'populate').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks(); 
  });

  describe('1. getAvailableOrders', () => {
    it('should successfully fetch, populate, and format available orders', async () => {
      req = httpMocks.createRequest({ query: { page: 1, limit: 10 } });

      const mockOrder = {
        toObject: () => ({ _id: 'order_1', status: 'Confirmed' }),
        product: { pickupLocation: 'Farm A', farmer: 'farmer_1' }
      };

      // FIX: For methods with different names at the end, we can use mockReturnThis()
      jest.spyOn(Order, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(), // Returns this object
        sort: jest.fn().mockReturnThis(),     // Returns this object
        skip: jest.fn().mockReturnThis(),     // Returns this object
        limit: jest.fn().mockResolvedValue([mockOrder]) // Resolves the Promise!
      });

      jest.spyOn(Order, 'countDocuments').mockResolvedValue(1);

      await getAvailableOrders(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(responseData.orders.length).toBe(1);
      expect(responseData.orders[0].pickupLocation).toBe('Farm A');
    });
  });

  describe('2. createTrip (Transporter Initiated)', () => {
    beforeEach(() => {
      const futurePickup = new Date();
      futurePickup.setDate(futurePickup.getDate() + 1);
      const futureDelivery = new Date();
      futureDelivery.setDate(futureDelivery.getDate() + 2);

      req = httpMocks.createRequest({
        user: { _id: 'transporter_1' },
        body: {
          orderId: 'order_1',
          vehicleId: 'vehicle_1',
          scheduledPickup: futurePickup.toISOString(),
          estimatedDelivery: futureDelivery.toISOString(),
          baseFare: 5000
        }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      req.body.baseFare = undefined;

      await createTrip(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Missing required fields');
    });

    it('should successfully create a trip and update vehicle/order status', async () => {
      jest.spyOn(Transporter, 'findById').mockResolvedValue({ _id: 'transporter_1' });

      // FIX: Proper nesting for identical chain methods (populate -> populate)
      jest.spyOn(Order, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'order_1',
            status: 'Confirmed',
            deliveryStatus: 'Requested',
            product: { 
              pickupLocation: { address: 'Farm Road', coordinates: {} },
              farmer: { location: {} } 
            },
            deliveryAddress: { addressLine: 'City Center', coordinates: {} },
            save: jest.fn().mockResolvedValue(true)
          })
        })
      });

      jest.spyOn(Trip, 'findOne').mockResolvedValue(null);

      const mockVehicle = {
        _id: 'vehicle_1',
        status: 'Available',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Vehicle, 'findOne').mockResolvedValue(mockVehicle);

      await createTrip(req, res);

      expect(res.statusCode).toBe(201);
      expect(Trip.prototype.addTimelineEvent).toHaveBeenCalledTimes(2);
      expect(Trip.prototype.save).toHaveBeenCalled();
      
      expect(mockVehicle.status).toBe('On Delivery');
      expect(mockVehicle.save).toHaveBeenCalled();
    });
  });

  describe('3. updateTripStatus (Completed Flow)', () => {
    it('should update trip to Completed, free up vehicle, and mark order as Delivered', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'transporter_1' },
        params: { id: 'trip_1' },
        body: { status: 'Completed' }
      });

      const mockTrip = {
        _id: 'trip_1',
        transporter: { _id: 'transporter_1' },
        tripStatus: 'In Progress',
        vehicle: { _id: 'vehicle_1' },
        order: 'order_1',
        schedule: {},
        addTimelineEvent: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // FIX: Proper nesting for Trip.findById().populate().populate()
      jest.spyOn(Trip, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrip)
        })
      });

      jest.spyOn(Vehicle, 'findByIdAndUpdate').mockResolvedValue(true);
      jest.spyOn(Order, 'findByIdAndUpdate').mockResolvedValue(true);

      await updateTripStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockTrip.tripStatus).toBe('Completed');
      expect(mockTrip.save).toHaveBeenCalled();

      expect(Vehicle.findByIdAndUpdate).toHaveBeenCalledWith('vehicle_1', { status: 'Available' });

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        'order_1',
        { deliveryStatus: 'Delivered', status: 'Delivered' },
        { new: true }
      );
    });

    it('should return 403 if transporter does not own the trip', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'hacker_transporter' },
        params: { id: 'trip_1' },
        body: { status: 'Completed' }
      });

      // FIX: Proper nesting for the failed auth check
      jest.spyOn(Trip, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            transporter: { _id: 'real_transporter' } 
          })
        })
      });

      await updateTripStatus(req, res);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('Not authorized');
    });
  });

  describe('4. getTripStats (Aggregation)', () => {
    it('should return successfully aggregated statistics', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'transporter_1' }
      });

      jest.spyOn(Trip, 'aggregate')
        .mockResolvedValueOnce([{ _id: 'Completed', count: 5, totalRevenue: 25000 }]) 
        .mockResolvedValueOnce([{ total: 5, onTimeCount: 4 }]) 
        .mockResolvedValueOnce([{ totalRevenue: 25000 }]); 

      jest.spyOn(Trip, 'countDocuments')
        .mockResolvedValueOnce(10) 
        .mockResolvedValueOnce(5)  
        .mockResolvedValueOnce(1)  
        .mockResolvedValueOnce(4); 

      await getTripStats(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      
      expect(responseData.stats.totalTrips).toBe(10);
      expect(responseData.stats.completionRate).toBe("50.0"); 
      expect(responseData.stats.onTimeDeliveryRate).toBe("80.0"); 
      expect(responseData.stats.revenueCompleted).toBe(25000);
    });
  });
});