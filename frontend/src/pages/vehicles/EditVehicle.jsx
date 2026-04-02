import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const EditVehicle = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [transporterId, setTransporterId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [formData, setFormData] = useState({
    category: '',
    vehicleType: '',
    brand: '',
    model: '',
    registrationNumber: '',
    fuelType: '',
    loadCapacity: {
      weight: {
        value: '',
        unit: 'kg'
      },
      volume: {
        value: '',
        unit: 'L'
      }
    },
    manufacturingYear: '',
    lastMaintenanceDate: '',
    nextMaintenanceDue: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    status: 'Available'
  });

  const categories = ['Truck', 'Lorry', 'Pickup', 'Van'];
  const vehicleTypes = ['Open body', 'Covered body', 'Refrigerated', 'Container'];
  const fuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid'];
  const statuses = ['Available', 'On Delivery', 'Maintenance', 'Offline'];

  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can edit vehicles',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchTransporterId();
    fetchVehicle();
  }, [token, user, id]);

  const fetchTransporterId = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user?._id) {
        setTransporterId(data.user._id);
      }
    } catch (error) {
      console.error('Failed to fetch transporter ID:', error);
    }
  };

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Vehicle not found');
      const data = await res.json();
      const vehicle = data.vehicle;
      
      setFormData({
        category: vehicle.category || '',
        vehicleType: vehicle.vehicleType || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        registrationNumber: vehicle.registrationNumber || '',
        fuelType: vehicle.fuelType || '',
        loadCapacity: {
          weight: {
            value: vehicle.loadCapacity?.weight?.value || '',
            unit: 'kg'
          },
          volume: {
            value: vehicle.loadCapacity?.volume?.value || '',
            unit: 'L'
          }
        },
        manufacturingYear: vehicle.manufacturingYear || '',
        lastMaintenanceDate: vehicle.lastMaintenanceDate ? vehicle.lastMaintenanceDate.split('T')[0] : '',
        nextMaintenanceDue: vehicle.nextMaintenanceDue ? vehicle.nextMaintenanceDue.split('T')[0] : '',
        insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
        registrationExpiry: vehicle.registrationExpiry ? vehicle.registrationExpiry.split('T')[0] : '',
        status: vehicle.status || 'Available'
      });
      
      // Set existing images
      if (vehicle.images && vehicle.images.length > 0) {
        setExistingImages(vehicle.images);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    
    if (totalImages > 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Too Many Images',
        text: 'Maximum 5 images allowed',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Each image must be less than 5MB',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeExistingImage = (index, publicId) => {
    setImagesToDelete([...imagesToDelete, publicId]);
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadNewImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const res = await fetch('http://localhost:3000/api/vehicles/upload-images', {
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
      return data.images;
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            value: value
          }
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateSLPlate = (plate) => {
    const normalizedPlate = plate.trim().replace(/\s+/g, ' ').toUpperCase();
    const oldFormat = /^[0-9]{1,3}\s+[A-Za-z]{2,4}\s+[0-9]{4}$/;
    const newFormatWithDistrictHyphen = /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{4}$/;
    const newFormatWithDistrictSpace = /^[A-Z]{2,3}\s+[A-Z]{2,3}\s+[0-9]{4}$/;
    const newFormatWithoutDistrictHyphen = /^[A-Z]{2,3}-[0-9]{4}$/;
    const newFormatWithoutDistrictSpace = /^[A-Z]{2,3}\s+[0-9]{4}$/;
    
    return oldFormat.test(normalizedPlate) ||
           newFormatWithDistrictHyphen.test(normalizedPlate) ||
           newFormatWithDistrictSpace.test(normalizedPlate) ||
           newFormatWithoutDistrictHyphen.test(normalizedPlate) ||
           newFormatWithoutDistrictSpace.test(normalizedPlate);
  };

  const validateForm = () => {
    if (!formData.brand.trim()) return 'Brand is required';
    if (!formData.model.trim()) return 'Model is required';
    if (!formData.registrationNumber.trim()) return 'Registration number is required';
    if (!validateSLPlate(formData.registrationNumber)) {
      return 'Invalid Sri Lankan vehicle registration number format';
    }
    if (!formData.loadCapacity.weight.value || formData.loadCapacity.weight.value <= 0) {
      return 'Valid weight capacity is required (minimum 500kg)';
    }
    if (formData.loadCapacity.weight.value < 500) {
      return 'Weight capacity cannot be less than 500kg';
    }
    if (formData.manufacturingYear) {
      const year = parseInt(formData.manufacturingYear);
      if (year < 1950 || year > currentYear) {
        return `Manufacturing year must be between 1950 and ${currentYear}`;
      }
    }
    if (formData.nextMaintenanceDue && formData.nextMaintenanceDue <= today) {
      return 'Next maintenance due must be a future date';
    }
    if (formData.lastMaintenanceDate && formData.lastMaintenanceDate > today) {
      return 'Last maintenance date cannot be a future date';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: validationError,
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (!transporterId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Transporter ID not loaded',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setSaving(true);
    
    // Upload new images
    let newImageUrls = [];
    if (imageFiles.length > 0) {
      newImageUrls = await uploadNewImages();
      if (newImageUrls.length === 0 && imageFiles.length > 0) {
        setSaving(false);
        return;
      }
    }
    
    // Combine existing images (excluding deleted ones) with new images
    const allImages = [...existingImages, ...newImageUrls];
    
    try {
      const payload = {
        ...formData,
        transporterId,
        loadCapacity: {
          weight: {
            value: parseFloat(formData.loadCapacity.weight.value),
            unit: 'kg'
          },
          volume: formData.loadCapacity.volume.value ? {
            value: parseFloat(formData.loadCapacity.volume.value),
            unit: 'L'
          } : undefined
        },
        manufacturingYear: formData.manufacturingYear ? parseInt(formData.manufacturingYear) : undefined,
        lastMaintenanceDate: formData.lastMaintenanceDate || undefined,
        nextMaintenanceDue: formData.nextMaintenanceDue || undefined,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        registrationExpiry: formData.registrationExpiry || undefined,
        images: allImages
      };

      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update vehicle');
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Vehicle has been updated successfully',
        confirmButtonColor: '#10b981',
        timer: 2000
      });
      
      navigate('/vehicles');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = [];
  for (let year = currentYear; year >= 1950; year--) {
    yearOptions.push(year);
  }

  if (loading) {
    return (
      <>
        <ProfileNav active="vehicles" links={[
          { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
          { key: 'trips', label: 'Trips', to: '/trips' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading vehicle details...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileNav active="vehicles" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'Trips', to: '/trips' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Vehicle</h1>
              <p className="text-slate-600">Update your vehicle information</p>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Images Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Vehicle Images</h2>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Current Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-emerald-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index, image.publicId)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Image Upload */}
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
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB (Max 5 images total)</p>
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
                
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">New Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-emerald-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {uploadingImages && (
                  <div className="text-center text-emerald-600">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <p className="mt-2">Uploading images...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Vehicle Status</h2>
              <div>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Basic Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="block text-sm font-semibold text-slate-700">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Registration Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Sri Lankan format: 40 Sri 1234, WP-LB-4321, or ABC-1234</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Manufacturing Year</label>
                  <select
                    name="manufacturingYear"
                    value={formData.manufacturingYear}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Fuel Type *</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {fuelTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Registration Expiry</label>
                  <input
                    type="date"
                    name="registrationExpiry"
                    value={formData.registrationExpiry}
                    onChange={handleChange}
                    min={today}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Capacity Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Capacity Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Weight Capacity (kg) *</label>
                  <input
                    type="number"
                    name="loadCapacity.weight.value"
                    value={formData.loadCapacity.weight.value}
                    onChange={handleChange}
                    min="500"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Volume Capacity (L)</label>
                  <input
                    type="number"
                    name="loadCapacity.volume.value"
                    value={formData.loadCapacity.volume.value}
                    onChange={handleChange}
                    min="100"
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance & Insurance */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Maintenance & Insurance</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Last Maintenance Date</label>
                  <input
                    type="date"
                    name="lastMaintenanceDate"
                    value={formData.lastMaintenanceDate}
                    onChange={handleChange}
                    max={today}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">Past dates only</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Next Maintenance Due</label>
                  <input
                    type="date"
                    name="nextMaintenanceDue"
                    value={formData.nextMaintenanceDue}
                    onChange={handleChange}
                    min={today}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">Future dates only</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Insurance Expiry Date</label>
                  <input
                    type="date"
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleChange}
                    min={today}
                    className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : uploadingImages ? 'Uploading Images...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
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

export default EditVehicle;