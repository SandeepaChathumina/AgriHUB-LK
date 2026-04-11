/* eslint-env jest */
import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import fs from 'fs';
import cloudinary from '../../config/cloudinary.js';

import { 
  createVehicle, 
  getMyVehicles, 
  updateVehicleStatus, 
  deleteVehicle,
  getAvailableVehicles 
} from '../vehicleController.js';

import Vehicle from '../../models/Vehicle.js';
import Transporter from '../../models/Transporter.js';

// --- MOCK EXTERNAL SERVICES ---
jest.mock('fs');
jest.mock('../../config/cloudinary.js', () => ({
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('Vehicle Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
    
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
    
    jest.spyOn(Vehicle.prototype, 'save').mockResolvedValue(true);
    jest.spyOn(Vehicle.prototype, 'populate').mockResolvedValue(true);
    jest.spyOn(Vehicle.prototype, 'deleteOne').mockResolvedValue(true);
    jest.spyOn(Transporter.prototype, 'save').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks(); 
  });

  describe('1. createVehicle', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        body: {
          transporterId: 'transporter_123',
          // FIX: Changed 'WP CAB-1234' to 'WP-CAB-1234' to perfectly match your Regex!
          registrationNumber: 'WP-CAB-1234', 
          category: 'Truck',
          vehicleType: 'Open body',
          fuelType: 'Diesel',
          loadCapacity: { weight: { value: 1000 } } 
        }
      });
    });

    it('should return 400 if Sri Lankan number plate is invalid', async () => {
      req.body.registrationNumber = 'INVALID-PLATE-99';

      jest.spyOn(Transporter, 'findById').mockResolvedValue({ _id: 'transporter_123' });

      await createVehicle(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('Invalid Sri Lankan vehicle registration number format');
    });

    it('should return 400 if vehicle already exists', async () => {
      jest.spyOn(Transporter, 'findById').mockResolvedValue({ _id: 'transporter_123' });
      
      // Mock findOne returning an existing vehicle
      jest.spyOn(Vehicle, 'findOne').mockResolvedValue({ _id: 'existing_veh' });

      await createVehicle(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('already exists');
    });

    it('should successfully create a new vehicle', async () => {
      const mockTransporter = { 
        _id: 'transporter_123', 
        fleetSize: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(Transporter, 'findById').mockResolvedValue(mockTransporter);
      jest.spyOn(Vehicle, 'findOne').mockResolvedValue(null); 

      await createVehicle(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData().message).toBe('Vehicle created successfully');
      expect(Vehicle.prototype.save).toHaveBeenCalled();
      expect(mockTransporter.fleetSize).toBe(1); 
      expect(mockTransporter.save).toHaveBeenCalled();
    });
  });

  describe('2. getMyVehicles', () => {
    it('should fetch and select the transporters vehicles', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'transporter_123' }
      });

      jest.spyOn(Vehicle, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'veh_1', registrationNumber: 'WP-CAB-1234' }])
      });

      await getMyVehicles(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().count).toBe(1);
      expect(Vehicle.find).toHaveBeenCalledWith({ transporter: 'transporter_123' });
    });
  });

  describe('3. updateVehicleStatus', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        user: { _id: 'transporter_123' },
        params: { id: 'veh_123' },
        body: { status: 'Maintenance' }
      });
    });

    it('should return 403 if transporter does not own the vehicle', async () => {
      jest.spyOn(Vehicle, 'findById').mockResolvedValue({
        _id: 'veh_123',
        transporter: 'different_transporter'
      });

      await updateVehicleStatus(req, res);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('Not authorized');
    });

    it('should successfully update the status if authorized', async () => {
      const mockVehicle = {
        _id: 'veh_123',
        transporter: 'transporter_123',
        status: 'Available',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Vehicle, 'findById').mockResolvedValue(mockVehicle);

      await updateVehicleStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockVehicle.status).toBe('Maintenance');
      expect(mockVehicle.save).toHaveBeenCalled();
    });
  });

  describe('4. deleteVehicle (With Cloudinary Cleanup)', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        params: { id: 'veh_123' },
        body: { transporterId: 'transporter_123' }
      });
    });

    it('should return 400 if vehicle is On Delivery', async () => {
      jest.spyOn(Vehicle, 'findById').mockResolvedValue({
        _id: 'veh_123',
        transporter: 'transporter_123',
        status: 'On Delivery'
      });

      await deleteVehicle(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('Cannot delete vehicle that is on delivery');
    });

    it('should delete vehicle, destroy images, and decrement fleet size', async () => {
      const mockVehicle = {
        _id: 'veh_123',
        transporter: 'transporter_123',
        status: 'Available',
        images: [{ publicId: 'cloud_image_1' }],
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Vehicle, 'findById').mockResolvedValue(mockVehicle);
      cloudinary.uploader.destroy.mockResolvedValue(true);
      jest.spyOn(Transporter, 'findByIdAndUpdate').mockResolvedValue(true);

      await deleteVehicle(req, res);

      expect(res.statusCode).toBe(200);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('cloud_image_1');
      expect(mockVehicle.deleteOne).toHaveBeenCalled();
      expect(Transporter.findByIdAndUpdate).toHaveBeenCalledWith(
        'transporter_123',
        { $inc: { fleetSize: -1 } }
      );
    });
  });

  describe('5. getAvailableVehicles (For Distributors)', () => {
    it('should filter out non-available vehicles and paginate correctly', async () => {
      req = httpMocks.createRequest({
        query: { category: 'Truck', page: 1, limit: 10 }
      });

      const mockVehicle = {
        _id: 'veh_1',
        status: 'Available',
        category: 'Truck'
      };

      jest.spyOn(Vehicle, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockVehicle])
      });

      jest.spyOn(Vehicle, 'countDocuments').mockResolvedValue(1);

      await getAvailableVehicles(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().count).toBe(1);
      
      expect(Vehicle.find).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Available',
        category: 'Truck'
      }));
    });
  });
});