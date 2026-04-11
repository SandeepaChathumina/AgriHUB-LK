// src/pages/products/AddProduct.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

// Import Leaflet dynamically
const AddProduct = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [gettingRegistrationLocation, setGettingRegistrationLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 7.8731, lng: 80.7718 }); // Sri Lanka center
  
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
  const districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Farmer') {
      toast.error('Only farmers can add products');
      navigate('/dashboard');
      return;
    }
    fetchUserProfile();
  }, [token, user]);

  useEffect(() => {
    // Initialize map after component mounts
    if (mapContainerRef.current && !mapInitialized) {
      initMap();
    }
  }, [mapContainerRef.current]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user) {
        setFarmerLocation(data.user.location);
        if (data.user.location?.coordinates) {
          setMapCenter({
            lat: data.user.location.coordinates.lat,
            lng: data.user.location.coordinates.lng
          });
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
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const initMap = async () => {
    if (!mapContainerRef.current || mapInitialized) return;
    
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default;
      await import('leaflet-routing-machine');
      
      // Fix marker icon issue
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      
      // Create map
      const map = L.map(mapContainerRef.current).setView([mapCenter.lat, mapCenter.lng], 10);
      mapRef.current = map;
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Add marker if farmer has location
      if (farmerLocation?.coordinates?.lat && farmerLocation?.coordinates?.lng) {
        const marker = L.marker([farmerLocation.coordinates.lat, farmerLocation.coordinates.lng], {
          draggable: true
        }).addTo(map);
        
        markerRef.current = marker;
        
        marker.bindPopup(`
          <b>Your Farm Location</b><br/>
          ${farmerLocation.address || 'Click and drag to adjust'}<br/>
          <i>Drag to change pickup location</i>
        `).openPopup();
        
        // Handle marker drag
        marker.on('dragend', async (e) => {
          const position = marker.getLatLng();
          await updateLocation(position.lat, position.lng);
        });
      }
      
      // Handle map click
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current = marker;
          marker.on('dragend', async (e) => {
            const position = marker.getLatLng();
            await updateLocation(position.lat, position.lng);
          });
        }
        
        await updateLocation(lat, lng);
        toast.success('Location selected on map');
      });
      
      setMapInitialized(true);
      console.log('Map initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      // Silently fail - don't show error message to user
    }
  };

  // Auto-detect district from coordinates
  const detectDistrictFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
      const data = await response.json();
      
      if (data.address) {
        // Try to get district/state from various possible fields
        let district = '';
        
        // For Sri Lanka, district is often in state_district, county, or state
        if (data.address.state_district) {
          district = data.address.state_district;
        } else if (data.address.county) {
          district = data.address.county;
        } else if (data.address.state) {
          district = data.address.state;
        }
        
        // Check if district is in our districts list
        const matchedDistrict = districts.find(d => 
          d.toLowerCase() === district.toLowerCase() ||
          district.toLowerCase().includes(d.toLowerCase())
        );
        
        if (matchedDistrict) {
          return matchedDistrict;
        }
      }
      return '';
    } catch (error) {
      console.error('District detection failed:', error);
      return '';
    }
  };

  const updateLocation = async (lat, lng) => {
    // Update form coordinates
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        type: 'Custom Location',
        coordinates: { lat, lng }
      }
    }));
    
    // Reverse geocode to get address and district
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data.display_name) {
        const addressParts = data.display_name.split(',');
        const address = addressParts[0] || '';
        const city = data.address?.city || data.address?.town || data.address?.village || '';
        
        // Auto-detect district
        let district = data.address?.state_district || data.address?.county || data.address?.state || '';
        
        // Find matching district from our list
        const matchedDistrict = districts.find(d => 
          district.toLowerCase().includes(d.toLowerCase()) || 
          d.toLowerCase().includes(district.toLowerCase())
        );
        
        const finalDistrict = matchedDistrict || district;
        
        setFormData(prev => ({
          ...prev,
          pickupLocation: {
            ...prev.pickupLocation,
            address: address,
            city: city,
            district: finalDistrict
          }
        }));
        
        if (finalDistrict && finalDistrict !== '') {
          toast.success(`District detected: ${finalDistrict}`);
        } else {
          toast.success('Address found! Please select district manually if needed.');
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Get user's current location using browser geolocation
  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update map view and marker
        if (mapRef.current && mapInitialized) {
          mapRef.current.setView([latitude, longitude], 15);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const L = await import('leaflet');
            const marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            marker.on('dragend', async (e) => {
              const pos = marker.getLatLng();
              await updateLocation(pos.lat, pos.lng);
            });
          }
        }
        
        await updateLocation(latitude, longitude);
        toast.success('Your current location detected!');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please enter location manually.';
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Get location from user's registration/profile data
  const getRegistrationLocation = () => {
    setGettingRegistrationLocation(true);
    
    if (!farmerLocation?.coordinates?.lat || !farmerLocation?.coordinates?.lng) {
      toast.error('No registration location found. Please update your profile first.');
      setGettingRegistrationLocation(false);
      return;
    }
    
    const { lat, lng } = farmerLocation.coordinates;
    
    // Update map view and marker
    if (mapRef.current && mapInitialized) {
      mapRef.current.setView([lat, lng], 13);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        // Marker will be created by map click or we can create it
        setTimeout(async () => {
          const L = await import('leaflet');
          if (!markerRef.current && mapRef.current) {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            marker.on('dragend', async (e) => {
              const pos = marker.getLatLng();
              await updateLocation(pos.lat, pos.lng);
            });
          }
        }, 100);
      }
    }
    
    // Update form with registration location
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        type: 'Farmer Location',
        address: farmerLocation.address || '',
        city: farmerLocation.city || '',
        district: farmerLocation.district || '',
        coordinates: farmerLocation.coordinates
      }
    }));
    
    toast.success('Registration location loaded! District: ' + (farmerLocation.district || 'Auto-detected'));
    setGettingRegistrationLocation(false);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
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
    const numValue = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        coordinates: {
          ...prev.pickupLocation.coordinates,
          [coord]: isNaN(numValue) ? '' : numValue
        }
      }
    }));
    
    // Update marker position on map
    if (!isNaN(numValue) && markerRef.current && mapRef.current && mapInitialized) {
      const lat = coord === 'lat' ? numValue : formData.pickupLocation.coordinates.lat;
      const lng = coord === 'lng' ? numValue : formData.pickupLocation.coordinates.lng;
      
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 13);
      }
    }
  };

  const useFarmerLocation = () => {
    if (farmerLocation?.coordinates?.lat && farmerLocation?.coordinates?.lng) {
      setFormData(prev => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          type: 'Farmer Location',
          address: farmerLocation.address || '',
          city: farmerLocation.city || '',
          district: farmerLocation.district || '',
          coordinates: farmerLocation.coordinates
        }
      }));
      
      if (markerRef.current && mapRef.current && mapInitialized) {
        markerRef.current.setLatLng([farmerLocation.coordinates.lat, farmerLocation.coordinates.lng]);
        mapRef.current.setView([farmerLocation.coordinates.lat, farmerLocation.coordinates.lng], 13);
      }
      
      toast.success('Farmer profile location loaded');
    } else {
      toast.error('No farmer location found in profile. Please update your profile first.');
    }
  };

  const validateForm = () => {
    if (!formData.productName.trim()) return 'Product name is required';
    if (!formData.quantity || formData.quantity <= 0) return 'Quantity must be greater than zero';
    if (!formData.price || formData.price < 0) return 'Price cannot be negative';
    if (!formData.pickupLocation.address.trim()) return 'Pickup address is required';
    if (!formData.pickupLocation.district) return 'Please select a district';
    if (!formData.pickupLocation.coordinates.lat || !formData.pickupLocation.coordinates.lng) {
      return 'Pickup location coordinates are required. Click on the map to select location.';
    }
    if (formData.harvestDate && formData.expiryDate) {
      if (new Date(formData.harvestDate).setHours(0,0,0,0) >= new Date(formData.expiryDate).setHours(0,0,0,0)) {
        return 'Harvest date must be before expiry date';
      }
    }
    // Validation for price decimal
    if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      return 'Price must be a valid number with up to 2 decimal places';
    }
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
      
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-emerald-950 drop-shadow-sm mb-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>List New Product</h1>
            <p className="text-emerald-700/80 font-medium tracking-wide">Showcase your harvest to thousands of potential buyers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">Product Images</h2>
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
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">Basic Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Variety</label>
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleChange}
                    placeholder="e.g., Red Long, White Rose"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Quality</label>
                  <select
                    name="quality"
                    value={formData.quality}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {qualities.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">Quantity & Pricing</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Price (LKR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/70 font-bold">LKR</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-2xl border-0 bg-slate-50/50 pl-14 pr-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Location with Map */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-950">Pickup Location</h2>
                  <p className="text-emerald-700/70 font-medium">Pinpoint exactly where your produce is stored</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="rounded-2xl bg-blue-50/80 ring-1 ring-blue-100 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    {gettingLocation ? 'Getting...' : '📍 Current'}
                  </button>
                  <button
                    type="button"
                    onClick={getRegistrationLocation}
                    disabled={gettingRegistrationLocation}
                    className="rounded-2xl bg-purple-50/80 ring-1 ring-purple-100 px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-100 transition disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    {gettingRegistrationLocation ? 'Loading...' : '📋 Registered'}
                  </button>
                  {farmerLocation?.coordinates?.lat && (
                    <button
                      type="button"
                      onClick={useFarmerLocation}
                      className="rounded-2xl bg-emerald-50/80 ring-1 ring-emerald-100 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      🌾 Profile
                    </button>
                  )}
                </div>
              </div>
              
              {/* Leaflet Map Container */}
              <div className="map-wrapper mb-4">
                <div 
                  ref={mapContainerRef} 
                  style={{ height: '400px', width: '100%' }}
                  className="rounded-xl overflow-hidden border border-emerald-200 bg-slate-100"
                />
              </div>
              
              {!mapInitialized && (
                <div className="text-center text-slate-500 text-sm mb-4">
                  Loading map...
                </div>
              )}
              <div className="grid gap-6 mt-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Address *</label>
                  <input
                    type="text"
                    value={formData.pickupLocation.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    placeholder="Street address, landmark"
                    required
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.pickupLocation.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">District *</label>
                    <select
                      value={formData.pickupLocation.district}
                      onChange={(e) => handleLocationChange('district', e.target.value)}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                      required
                    >
                      <option value="">Select District</option>
                      {districts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lat}
                      onChange={(e) => handleCoordinatesChange('lat', e.target.value)}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                      placeholder="Click on map"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lng}
                      onChange={(e) => handleCoordinatesChange('lng', e.target.value)}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                      placeholder="Click on map"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Pickup Instructions</label>
                  <textarea
                    value={formData.pickupLocation.instructions}
                    onChange={(e) => handleLocationChange('instructions', e.target.value)}
                    rows="2"
                    placeholder="e.g., Call before arrival, Gate code, Landmarks, etc."
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">Additional Details</h2>
              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your product (quality, freshness, farming method, etc.)"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Harvest Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      max={formData.expiryDate || undefined}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      min={formData.harvestDate || new Date().toISOString().split('T')[0]}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-[0.99] disabled:opacity-50 disabled:grayscale"
              >
                {loading ? 'Creating...' : uploadingImages ? 'Uploading Images...' : 'Publish Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-products')}
                className="rounded-2xl border-2 border-slate-200 bg-white/80 px-8 py-4 text-lg font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
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