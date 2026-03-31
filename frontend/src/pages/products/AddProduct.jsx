import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const AddProduct = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: 'Vegetables',
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
    images: [],
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
    fetchUserProfile();
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user && data.user.location) {
        setFarmerLocation(data.user.location);
        setFormData(prev => ({
          ...prev,
          pickupLocation: {
            ...prev.pickupLocation,
            address: data.user.location.address || '',
            city: data.user.location.city || '',
            district: data.user.location.district || '',
            coordinates: data.user.location.coordinates || { lat: '', lng: '' }
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const res = await fetch('http://localhost:3000/api/products/upload-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload images');
      }
      
      const data = await res.json();
      const imageUrls = data.images.map(img => img.url);
      setUploadedImageUrls(imageUrls);
      toast.success(`${imageUrls.length} images uploaded successfully`);
      return imageUrls;
    } catch (error) {
      toast.error(error.message);
      return [];
    } finally {
      setUploadingImages(false);
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

    setLoading(true);
    try {
      // Upload images first
      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
        if (imageUrls.length === 0 && imageFiles.length > 0) {
          throw new Error('Failed to upload images');
        }
      }
      
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        harvestDate: formData.harvestDate || null,
        expiryDate: formData.expiryDate || null,
        images: imageUrls,
        pickupLocation: {
          ...formData.pickupLocation,
          coordinates: {
            lat: parseFloat(formData.pickupLocation.coordinates.lat),
            lng: parseFloat(formData.pickupLocation.coordinates.lng)
          }
        }
      };

      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create product');
      }

      toast.success('Product created successfully!');
      navigate('/my-products');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProfileNav active="add-product" links={[
        { key: 'my-products', label: 'My Products', to: '/my-products' },
        { key: 'add-product', label: 'Add Product', to: '/products/add' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
            <p className="text-slate-600">List your agricultural products for sale</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Product Images</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl border-emerald-300 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-slate-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB (Max 5 images)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-emerald-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {uploadingImages && (
                  <div className="text-center text-emerald-600">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <p className="mt-2">Uploading images to Cloudinary...</p>
                  </div>
                )}
              </div>
            </div>

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

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : uploadingImages ? 'Uploading Images...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-products')}
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

export default AddProduct;