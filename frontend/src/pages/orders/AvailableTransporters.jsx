import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const transporterAvatarUrl = (t) =>
  t?.logo?.url || t?.profilePicture || t?.image?.url;

const AvailableTransporters = () => {
  const { orderId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [transporters, setTransporters] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalVehicle, setDetailsModalVehicle] = useState(null);
  const [showTransporterBadge, setShowTransporterBadge] = useState({});
  const [failedTransporterImages, setFailedTransporterImages] = useState({});
  
  const [filters, setFilters] = useState({
    vehicleCategory: 'All',
    vehicleType: 'All',
    minCapacity: '',
    district: 'All'
  });

  const [tripForm, setTripForm] = useState({
    scheduledPickup: '',
    estimatedDelivery: '',
    proposedFare: ''
  });

  const categories = ['All', 'Truck', 'Lorry', 'Pickup', 'Van'];
  const vehicleTypes = ['All', 'Open', 'Covered', 'Refrigerated', 'Container'];
  const districts = ['All', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Distributor') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only distributors can request transport',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchOrderDetails();
    fetchAvailableTransporters();
  }, [token, user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const data = await res.json();
      setOrder(data.order);
      
      // Set default pickup time (tomorrow at 9 AM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      // Set default delivery time (day after tomorrow at 5 PM)
      const deliveryDate = new Date(tomorrow);
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      deliveryDate.setHours(17, 0, 0, 0);
      
      setTripForm(prev => ({
        ...prev,
        scheduledPickup: tomorrow.toISOString().slice(0, 16),
        estimatedDelivery: deliveryDate.toISOString().slice(0, 16)
      }));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    }
  };

  const fetchAvailableTransporters = async () => {
    setLoading(true);
    try {
      // Fetch all vehicles and group by transporter
      const params = new URLSearchParams({
        status: 'Available',
        limit: 100
      });

      if (filters.vehicleCategory !== 'All') {
        params.append('category', filters.vehicleCategory);
      }
      if (filters.vehicleType !== 'All') {
        params.append('vehicleType', filters.vehicleType);
      }
      if (filters.district !== 'All') {
        params.append('district', filters.district);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/vehicles/available?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      
      // Group vehicles by transporter
      const transporterMap = {};
      data.vehicles?.forEach(vehicle => {
        if (vehicle.transporter) {
          const transporterId = vehicle.transporter._id;
          if (!transporterMap[transporterId]) {
            transporterMap[transporterId] = {
              ...vehicle.transporter,
              vehicles: []
            };
          }
          
          // Filter by capacity if specified
          if (filters.minCapacity) {
            const weightCap = vehicle.loadCapacity?.weight?.value || 0;
            if (weightCap < parseInt(filters.minCapacity)) {
              return;
            }
          }
          
          transporterMap[transporterId].vehicles.push(vehicle);
        }
      });
      
      setTransporters(Object.values(transporterMap));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableTransporters();
  }, [filters]);

  const handleSelectVehicle = (vehicle, transporter) => {
    setSelectedVehicle(selectedVehicle?._id === vehicle._id ? null : vehicle);
    setSelectedTransporter(transporter);
  };

  const handleViewDetails = (vehicle, e) => {
    e.stopPropagation();
    setDetailsModalVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const calculateTotalCost = () => {
    return parseFloat(tripForm.proposedFare) || 0;
  };

  const handleRequestTrip = async () => {
    if (!selectedVehicle || !selectedTransporter) {
      Swal.fire({
        icon: 'warning',
        title: 'No Vehicle Selected',
        text: 'Please select a vehicle to request transport',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (!tripForm.scheduledPickup || !tripForm.estimatedDelivery) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Dates',
        text: 'Please select pickup and delivery dates',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (!tripForm.proposedFare || parseFloat(tripForm.proposedFare) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Fare',
        text: 'Please enter a valid proposed fare',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Request Transport',
      html: `
        <div style="text-align: left;">
          <p><strong>Order:</strong> ${order?.product?.productName || 'Order'}</p>
          <p><strong>Vehicle:</strong> ${selectedVehicle.brand} ${selectedVehicle.model}</p>
          <p><strong>Category:</strong> ${selectedVehicle.category}</p>
          <p><strong>Transporter:</strong> ${selectedTransporter?.businessName || selectedTransporter?.companyName || 'N/A'}</p>
          <p><strong>Location:</strong> ${selectedTransporter?.location?.city || 'N/A'}, ${selectedTransporter?.location?.district || 'N/A'}</p>
          <p><strong>Proposed Fare:</strong> LKR ${calculateTotalCost().toLocaleString()}</p>
          <p><strong>Pickup:</strong> ${new Date(tripForm.scheduledPickup).toLocaleString()}</p>
          <p><strong>Delivery:</strong> ${new Date(tripForm.estimatedDelivery).toLocaleString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Request Transport',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setRequesting(true);
    try {
      const payload = {
        orderId,
        vehicleId: selectedVehicle._id,
        scheduledPickup: tripForm.scheduledPickup,
        estimatedDelivery: tripForm.estimatedDelivery,
        expectedDeliveryFee: parseFloat(tripForm.proposedFare)
      };

      const res = await fetch(`${API_BASE_URL}/api/trips/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to request transport');
      }

      Swal.fire({
        icon: 'success',
        title: 'Request Sent!',
        text: 'Your transport request has been sent to the transporter',
        confirmButtonColor: '#10b981',
        timer: 3000
      });

      navigate('/orders');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setRequesting(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Truck': return '🚛';
      case 'Lorry': return '🚚';
      case 'Pickup': return '🛻';
      case 'Van': return '🚐';
      default: return '🚗';
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <span className="inline-flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-amber-500 text-sm">★</span>
        ))}
        {hasHalfStar && (
          <span className="text-amber-500 text-sm">½</span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-slate-300 text-sm">★</span>
        ))}
      </span>
    );
  };

  if (loading && !order) {
    return (
      <>
        <ProfileNav active="orders" links={[
          { key: 'orders', label: 'My Orders', to: '/orders' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading available transporters...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileNav active="orders" links={[
        { key: 'orders', label: 'My Orders', to: '/orders' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Request Transport</h1>
              <p className="text-slate-600">Select a transporter and vehicle to deliver your order</p>
            </div>
            <Link
              to="/orders"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              ← Back to Orders
            </Link>
          </div>

          {/* Order Summary */}
          {order && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 shadow-sm ring-1 ring-emerald-200">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Order Summary</h2>
              <div className="grid gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-slate-500">Product</p>
                  <p className="font-semibold text-slate-900">{order.product?.productName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Quantity</p>
                  <p className="font-semibold text-slate-900">{order.quantity} {order.product?.unit || 'kg'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Pickup (Farmer Location)</p>
                  <p className="font-semibold text-slate-900">{order.product?.pickupLocation?.district || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Delivery Location</p>
                  <p className="font-semibold text-slate-900">{order.deliveryAddress?.city || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Transporter List */}
            <div className="lg:col-span-2">
              {/* Filters */}
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="grid gap-3 md:grid-cols-4">
                  <select
                    value={filters.vehicleCategory}
                    onChange={(e) => setFilters({ ...filters, vehicleCategory: e.target.value })}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Min Capacity (kg)"
                    value={filters.minCapacity}
                    onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {districts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transporters Cards */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-slate-500">Loading available transporters...</div>
                </div>
              ) : transporters.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                  <div className="text-6xl mb-4">🚚</div>
                  <p className="text-slate-500">No available transporters found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {transporters.map(transporter => {
                    const tId = String(transporter._id);
                    const avatarSrc = transporterAvatarUrl(transporter);
                    const avatarFailed = failedTransporterImages[tId];
                    return (
                    <div key={transporter._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      {/* Transporter Header */}
                      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          {/* Transporter Logo / profile picture (same as dashboard) */}
                          <div className="flex-shrink-0">
                            {avatarSrc && !avatarFailed ? (
                              <img
                                src={avatarSrc}
                                alt={transporter.businessName || transporter.companyName}
                                className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200 shadow-md"
                                onError={() => {
                                  setFailedTransporterImages(prev => ({ ...prev, [tId]: true }));
                                }}
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white shadow-md border-2 border-emerald-200">
                                {(transporter.businessName || transporter.companyName || 'T').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Transporter Info */}
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {transporter.businessName || transporter.companyName}
                            </h3>
                            <div className="flex items-center gap-2 mb-1">
                              {renderStars(transporter.rating?.averageRating || 0)}
                              <span className="text-xs text-slate-500">({transporter.rating?.totalReviews || 0} reviews)</span>
                            </div>
                            <p className="text-sm text-slate-600">
                              📍 {transporter.location?.city}, {transporter.location?.district}
                            </p>
                            <p className="text-sm text-slate-600">
                              📞 {transporter.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-600">
                            {transporter.vehicles.length} vehicle{transporter.vehicles.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>

                      {/* Vehicles Grid */}
                      <div className="grid gap-4 md:grid-cols-1">
                        {transporter.vehicles.map(vehicle => (
                          <div
                            key={vehicle._id}
                            onClick={() => handleSelectVehicle(vehicle, transporter)}
                            className={`cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all hover:shadow-md ${
                              selectedVehicle?._id === vehicle._id
                                ? 'ring-2 ring-emerald-500 bg-emerald-50/30'
                                : 'ring-slate-200'
                            }`}
                          >
                            <div className="flex gap-5">
                              {/* Vehicle Image */}
                              <div className="flex-shrink-0">
                                {vehicle.images && vehicle.images.length > 0 ? (
                                  <img
                                    src={vehicle.images[0].url}
                                    alt={vehicle.brand}
                                    className="h-32 w-32 rounded-xl object-cover border-2 border-emerald-200 shadow-md"
                                  />
                                ) : (
                                  <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100 text-5xl">
                                    {getCategoryIcon(vehicle.category)}
                                  </div>
                                )}
                              </div>

                              {/* Vehicle Details */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-xl font-bold text-slate-900">
                                        {vehicle.brand} {vehicle.model}
                                      </h4>
                                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        Available
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-500">Registration: {vehicle.registrationNumber || 'N/A'}</p>
                                  </div>
                                  {selectedVehicle?._id === vehicle._id && (
                                    <span className="text-emerald-600 text-lg font-bold">✓</span>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="rounded-lg bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Category</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">{vehicle.category}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">{vehicle.vehicleType}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Fuel</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">{vehicle.fuelType}</p>
                                  </div>
                                  <div className="rounded-lg bg-emerald-50 p-3">
                                    <p className="text-xs text-emerald-600 uppercase font-semibold">⚖️ Weight Capacity</p>
                                    <p className="text-sm font-bold text-emerald-700 mt-1">{vehicle.loadCapacity?.weight?.value || 'N/A'} kg</p>
                                  </div>
                                  <div className="rounded-lg bg-emerald-50 p-3">
                                    <p className="text-xs text-emerald-600 uppercase font-semibold">📦 Volume</p>
                                    <p className="text-sm font-bold text-emerald-700 mt-1">{vehicle.loadCapacity?.volume?.value || 'N/A'} {vehicle.loadCapacity?.volume?.unit || 'L'}</p>
                                  </div>
                                  <div className="rounded-lg bg-blue-50 p-3">
                                    <p className="text-xs text-blue-600 uppercase font-semibold">📍 Location</p>
                                    <p className="text-sm font-bold text-blue-700 mt-1">{transporter.location?.city || 'N/A'}</p>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleSelectVehicle(vehicle, transporter)}
                                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                                      selectedVehicle?._id === vehicle._id
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {selectedVehicle?._id === vehicle._id ? 'Selected' : 'Select Vehicle'}
                                  </button>
                                  <button
                                    onClick={(e) => handleViewDetails(vehicle, e)}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Transport Request Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Transport Request</h2>
                
                {!selectedVehicle || !selectedTransporter ? (
                  <div className="rounded-xl bg-amber-50 p-4 text-center text-amber-700">
                    <p className="text-sm">Select a vehicle from the list to continue</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-600 uppercase font-semibold">Selected Vehicle</p>
                      <p className="font-semibold text-slate-900">{selectedVehicle.brand} {selectedVehicle.model}</p>
                      <p className="text-sm text-slate-600">{selectedVehicle.registrationNumber}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Transporter: {selectedTransporter?.businessName || selectedTransporter?.companyName || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Scheduled Pickup *</label>
                        <input
                          type="datetime-local"
                          value={tripForm.scheduledPickup}
                          onChange={(e) => setTripForm({ ...tripForm, scheduledPickup: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Estimated Delivery *</label>
                        <input
                          type="datetime-local"
                          value={tripForm.estimatedDelivery}
                          onChange={(e) => setTripForm({ ...tripForm, estimatedDelivery: e.target.value })}
                          min={tripForm.scheduledPickup}
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Proposed Fare (LKR) *</label>
                        <input
                          type="number"
                          placeholder="Enter proposed fare"
                          value={tripForm.proposedFare}
                          onChange={(e) => setTripForm({ ...tripForm, proposedFare: e.target.value })}
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Transporter can accept or counter-offer this amount
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-100 p-4">
                        <div className="flex justify-between text-base font-bold">
                          <span>Your Offer:</span>
                          <span className="text-emerald-600">LKR {calculateTotalCost().toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleRequestTrip}
                        disabled={requesting}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {requesting ? 'Requesting...' : 'Send Transport Request'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {showDetailsModal && detailsModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowDetailsModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-xl font-bold text-slate-900">Vehicle Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 transition"
              >
                <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Images Gallery */}
              {detailsModalVehicle.images && detailsModalVehicle.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {detailsModalVehicle.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`${detailsModalVehicle.brand} ${idx + 1}`}
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 ring-1 ring-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{getCategoryIcon(detailsModalVehicle.category)}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{detailsModalVehicle.brand} {detailsModalVehicle.model}</h3>
                    <p className="text-sm text-slate-600">License: {detailsModalVehicle.registrationNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                    ✓ Available
                  </span>
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                    {detailsModalVehicle.status}
                  </span>
                </div>
              </div>

              {/* Specifications */}
              <div className="mb-6">
                <h4 className="mb-4 text-lg font-bold text-slate-900">Specifications</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Category</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{detailsModalVehicle.category}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Vehicle Type</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{detailsModalVehicle.vehicleType}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Fuel Type</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{detailsModalVehicle.fuelType}</p>
                  </div>
                </div>
              </div>

              {/* Load Capacity */}
              <div className="mb-6">
                <h4 className="mb-4 text-lg font-bold text-slate-900">Load Capacity</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <p className="text-sm text-emerald-600 uppercase font-semibold">⚖️ Weight Capacity</p>
                    <p className="text-xl font-bold text-emerald-700 mt-2">
                      {detailsModalVehicle.loadCapacity?.weight?.value || 'N/A'} {detailsModalVehicle.loadCapacity?.weight?.unit || 'kg'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
                    <p className="text-sm text-blue-600 uppercase font-semibold">📦 Volume</p>
                    <p className="text-xl font-bold text-blue-700 mt-2">
                      {detailsModalVehicle.loadCapacity?.volume?.value || 'N/A'} {detailsModalVehicle.loadCapacity?.volume?.unit || 'L'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Features */}
              {(detailsModalVehicle.specialFeatures || detailsModalVehicle.features) && (
                <div className="mb-6">
                  <h4 className="mb-4 text-lg font-bold text-slate-900">Special Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {(detailsModalVehicle.specialFeatures || detailsModalVehicle.features)?.map((feature, idx) => (
                      <span key={idx} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transporter Info */}
              <div className="rounded-xl border-2 border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {/* Transporter profile picture (same as dashboard logo) */}
                  <div className="relative">
                    {(() => {
                      const modalT = detailsModalVehicle.transporter;
                      const modalAvatarSrc = transporterAvatarUrl(modalT);
                      const modalVehicleKey = String(detailsModalVehicle._id);
                      const modalAvatarFailed = showTransporterBadge[modalVehicleKey];
                      return modalAvatarSrc && !modalAvatarFailed ? (
                        <img
                          src={modalAvatarSrc}
                          alt={modalT?.businessName || modalT?.companyName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-emerald-200 shadow-md"
                          onError={() => {
                            setShowTransporterBadge(prev => ({ ...prev, [modalVehicleKey]: true }));
                          }}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-md border-2 border-emerald-200">
                          {(modalT?.businessName || modalT?.companyName || 'T').charAt(0).toUpperCase()}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Transporter Information</h4>
                    <p className="text-xs text-slate-500">{detailsModalVehicle.transporter?.businessName || detailsModalVehicle.transporter?.companyName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-semibold">Company:</span> {detailsModalVehicle.transporter?.businessName || detailsModalVehicle.transporter?.companyName}</p>
                  <p className="text-sm"><span className="font-semibold">Location:</span> {detailsModalVehicle.transporter?.location?.city}, {detailsModalVehicle.transporter?.location?.district}</p>
                  <p className="text-sm"><span className="font-semibold">Phone:</span> {detailsModalVehicle.transporter?.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailableTransporters;
