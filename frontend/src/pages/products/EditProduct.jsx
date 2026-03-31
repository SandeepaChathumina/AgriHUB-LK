import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const EditProduct = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farmerLocation, setFarmerLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    variety: '',
    quantity: '',
    unit: 'kg',
    price: '',
    currency: 'LKR',
    description: '',
    quality: 'Standard',
    harvestDate: '',
    expiryDate: '',
    isAvailable: true,
    status: 'Available',
    pickupLocation: {
      type: 'Farmer Location',
      address: '',
      city: '',
      district: '',
      coordinates: { lat: '', lng: '' },
      instructions: ''
    }
  });

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];
  const units = ['kg', 'g', 'ton', 'dozen', 'pieces', 'litre', 'bundle'];
  const qualities = ['Premium', 'Standard', 'Economy'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProduct();
    fetchUserProfile();
  }, [token, id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setFormData({
        productName: data.product.productName || '',
        category: data.product.category || '',
        variety: data.product.variety || '',
        quantity: data.product.quantity || '',
        unit: data.product.unit || 'kg',
        price: data.product.price || '',
        currency: data.product.currency || 'LKR',
        description: data.product.description || '',
        quality: data.product.quality || 'Standard',
        harvestDate: data.product.harvestDate ? data.product.harvestDate.split('T')[0] : '',
        expiryDate: data.product.expiryDate ? data.product.expiryDate.split('T')[0] : '',
        isAvailable: data.product.isAvailable,
        status: data.product.status,
        pickupLocation: data.product.pickupLocation || {
          type: 'Farmer Location',
          address: '',
          city: '',
          district: '',
          coordinates: { lat: '', lng: '' },
          instructions: ''
        }
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user && data.user.location) {
        setFarmerLocation(data.user.location);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        [field]: value
      }
    }));
  };

  const handleCoordinatesChange = (coord, value) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        coordinates: {
          ...prev.pickupLocation.coordinates,
          [coord]: parseFloat(value) || ''
        }
      }
    }));
  };

  const useFarmerLocation = () => {
    if (farmerLocation) {
      setFormData(prev => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          type: 'Farmer Location',
          address: farmerLocation.address || '',
          city: farmerLocation.city || '',
          district: farmerLocation.district || '',
          coordinates: farmerLocation.coordinates || { lat: '', lng: '' }
        }
      }));
      toast.success('Farmer location loaded');
    }
  };

  const validateForm = () => {
    if (!formData.productName.trim()) return 'Product name is required';
    if (!formData.quantity || formData.quantity <= 0) return 'Valid quantity is required';
    if (!formData.price || formData.price <= 0) return 'Valid price is required';
    if (!formData.pickupLocation.address.trim()) return 'Pickup address is required';
    if (!formData.pickupLocation.coordinates.lat || !formData.pickupLocation.coordinates.lng) {
      return 'Pickup location coordinates are required';
    }
    const lat = parseFloat(formData.pickupLocation.coordinates.lat);
    const lng = parseFloat(formData.pickupLocation.coordinates.lng);
    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
    if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        harvestDate: formData.harvestDate || null,
        expiryDate: formData.expiryDate || null,
        pickupLocation: {
          ...formData.pickupLocation,
          coordinates: {
            lat: parseFloat(formData.pickupLocation.coordinates.lat),
            lng: parseFloat(formData.pickupLocation.coordinates.lng)
          }
        }
      };

      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update product');
      }

      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">Loading product...</div>
      </div>
    );
  }

  return (
    <>
      <ProfileNav active="products" links={[
        { key: 'products', label: 'My Products', to: '/products' },
        { key: 'add-product', label: 'Add Product', to: '/products/add' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Edit Product</h1>
            <p className="text-slate-600">Update your product information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Variety</label>
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleChange}
                    placeholder="e.g., Red Long, White Rose"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Quality</label>
                  <select
                    name="quality"
                    value={formData.quality}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {qualities.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Quantity & Price</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Price (LKR) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Pickup Location</h2>
                {farmerLocation && (
                  <button
                    type="button"
                    onClick={useFarmerLocation}
                    className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Use My Location
                  </button>
                )}
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Address *</label>
                  <input
                    type="text"
                    value={formData.pickupLocation.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">City</label>
                    <input
                      type="text"
                      value={formData.pickupLocation.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">District</label>
                    <input
                      type="text"
                      value={formData.pickupLocation.district}
                      onChange={(e) => handleLocationChange('district', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lat}
                      onChange={(e) => handleCoordinatesChange('lat', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lng}
                      onChange={(e) => handleCoordinatesChange('lng', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Pickup Instructions</label>
                  <textarea
                    value={formData.pickupLocation.instructions}
                    onChange={(e) => handleLocationChange('instructions', e.target.value)}
                    rows="2"
                    placeholder="e.g., Call before arrival, Gate code, etc."
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Additional Details</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your product (quality, freshness, etc.)"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Harvest Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Product Status</h2>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isAvailable"
                    value="true"
                    checked={formData.isAvailable === true}
                    onChange={() => setFormData(prev => ({ ...prev, isAvailable: true, status: 'Available' }))}
                  />
                  <span>Available for Sale</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isAvailable"
                    value="false"
                    checked={formData.isAvailable === false}
                    onChange={() => setFormData(prev => ({ ...prev, isAvailable: false, status: 'Sold Out' }))}
                  />
                  <span>Sold Out</span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProduct;