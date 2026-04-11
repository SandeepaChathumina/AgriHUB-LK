/* eslint-env jest */
import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import fs from 'fs';
import cloudinary from '../../config/cloudinary.js';

import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../productController.js';

import Product from '../../models/Product.js';
import Farmer from '../../models/Farmer.js';

// --- MOCK DEPENDENCIES ---
jest.mock('../../models/Product.js');
jest.mock('../../models/Farmer.js');
jest.mock('fs');
jest.mock('../../config/cloudinary.js', () => ({
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock mongoose ObjectId validation
mongoose.Types.ObjectId.isValid = jest.fn();

describe('Product Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
  });

  describe('1. createProduct', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        user: { _id: 'farmer_123' },
        body: {
          productName: 'Fresh Tomatoes',
          category: 'Vegetables',
          quantity: 100,
          unit: 'kg',
          price: 150,
          pickupLocation: {
            address: '123 Farm Road',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          }
        }
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = undefined; // Remove user
      await createProduct(req, res);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toContain('Not authorized');
    });

    it('should return 403 if the user is not found in the Farmer collection', async () => {
      Farmer.findById.mockResolvedValue(null);
      await createProduct(req, res);
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('Only farmers can create products');
    });

    it('should return 400 if required fields are missing', async () => {
      Farmer.findById.mockResolvedValue({ _id: 'farmer_123' });
      req.body.productName = undefined; // Remove a required field

      await createProduct(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('Missing required fields');
    });

    it('should successfully create a product', async () => {
      Farmer.findById.mockResolvedValue({ 
        _id: 'farmer_123',
        location: { coordinates: { lat: 6.9271, lng: 79.8612 } } // Matches payload
      });

      // Mock Product Save & Populate
      jest.spyOn(Product.prototype, 'save').mockResolvedValue(true);
      jest.spyOn(Product.prototype, 'populate').mockResolvedValue(true);

      await createProduct(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData().message).toBe('Product created successfully');
      expect(Product.prototype.save).toHaveBeenCalled();
    });
  });

  describe('2. getAllProducts', () => {
    it('should fetch and paginate products successfully', async () => {
      req = httpMocks.createRequest({
        query: { page: 1, limit: 10, category: 'Vegetables' }
      });

      // Mock Chained DB call: Product.find().populate().sort().skip().limit()
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: 'prod_1', productName: 'Tomatoes' }
        ])
      });

      Product.countDocuments.mockResolvedValue(1);

      await getAllProducts(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(responseData.total).toBe(1);
      expect(responseData.products.length).toBe(1);
      expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
        category: 'Vegetables',
        isAvailable: true
      }));
    });
  });

  describe('3. getProductById', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({ params: { id: 'prod_123' } });
    });

    it('should return 400 for invalid Object ID format', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      await getProductById(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if product is not found', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getProductById(req, res);
      expect(res.statusCode).toBe(404);
    });

    it('should return product and increment view count', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      const mockProduct = {
        _id: 'prod_123',
        productName: 'Carrots',
        viewCount: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      });

      await getProductById(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockProduct.viewCount).toBe(6); // Verifies increment logic
      expect(mockProduct.save).toHaveBeenCalled();
    });
  });

  describe('4. updateProduct', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        user: { _id: 'farmer_123' },
        params: { id: 'prod_123' },
        body: { price: 200 }
      });
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    });

    it('should return 403 if someone other than the owner tries to update', async () => {
      Product.findById.mockResolvedValue({ 
        _id: 'prod_123', 
        farmer: 'different_farmer_999' // Different ID
      });

      await updateProduct(req, res);
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toContain('not authorized');
    });

    it('should successfully update the product', async () => {
      Product.findById.mockResolvedValue({ 
        _id: 'prod_123', 
        farmer: 'farmer_123' // Matches req.user._id
      });

      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'prod_123',
          price: 200
        })
      });

      await updateProduct(req, res);

      expect(res.statusCode).toBe(200);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod_123',
        { $set: { price: 200 } },
        expect.any(Object)
      );
    });
  });

  describe('5. deleteProduct (With Cloudinary cleanup)', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        user: { _id: 'farmer_123', role: 'Farmer' },
        params: { id: 'prod_123' }
      });
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    });

    it('should delete product and destroy images from Cloudinary', async () => {
      const mockProduct = {
        _id: 'prod_123',
        farmer: 'farmer_123', // User is owner
        images: [{ publicId: 'cloud_img_1' }, { publicId: 'cloud_img_2' }],
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(mockProduct);
      cloudinary.uploader.destroy.mockResolvedValue(true);

      await deleteProduct(req, res);

      expect(res.statusCode).toBe(200);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('cloud_img_1');
      expect(mockProduct.deleteOne).toHaveBeenCalled();
    });
  });
});