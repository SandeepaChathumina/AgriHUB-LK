import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AvailableVehicles = () => {
  const { orderId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    vehicleType: 'All',
    minCapacity: '',
    district: 'All'
  });

  const [tripForm, setTripForm] = useState({
    scheduledPickup: '',
    estimatedDelivery: '',
    expectedDeliveryFee: ''
  });

  const categories = ['All', 'Truck', 'Lorry', 'Pickup', 'Van'];
  const vehicleTypes = ['All', 'Open body', 'Covered body', 'Refrigerated', 'Container'];
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
    fetchAvailableVehicles();
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

  const fetchAvailableVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'Available',
        ...(filters.category !== 'All' && { category: filters.category }),
        ...(filters.vehicleType !== 'All' && { vehicleType: filters.vehicleType }),
        ...(filters.district !== 'All' && { district: filters.district }),
        limit: 50
      });
      
      const res = await fetch(`${API_BASE_URL}/api/vehicles/available?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      
      let filteredVehicles = data.vehicles || [];
      if (filters.minCapacity) {
        filteredVehicles = filteredVehicles.filter(v => 
          (v.loadCapacity?.weight?.value || 0) >= parseInt(filters.minCapacity)
        );
      }
      
      setVehicles(filteredVehicles);
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
    fetchAvailableVehicles();
  }, [filters]);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(selectedVehicle?._id === vehicle._id ? null : vehicle);
  };

  const handleViewDetails = (vehicle, e) => {
    e.stopPropagation();
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const calculateTotalCost = () => {
    return parseFloat(tripForm.expectedDeliveryFee) || 0;
  };

  const handleRequestTrip = async () => {
    if (!selectedVehicle) {
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

    if (!tripForm.expectedDeliveryFee || parseFloat(tripForm.expectedDeliveryFee) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Fee',
        text: 'Please enter a valid expected delivery fee',
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
          <p><strong>Transporter:</strong> ${selectedVehicle.transporter?.businessName || selectedVehicle.transporter?.companyName || 'N/A'}</p>
          <p><strong>Location:</strong> ${selectedVehicle.transporter?.location?.city || 'N/A'}, ${selectedVehicle.transporter?.location?.district || 'N/A'}</p>
          <p><strong>Expected Delivery Fee:</strong> LKR ${calculateTotalCost().toLocaleString()}</p>
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
        expectedDeliveryFee: parseFloat(tripForm.expectedDeliveryFee)
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !order) {
    return (
      <>
        <ProfileNav active="orders" links={[
          { key: 'orders', label: 'My Orders', to: '/orders' },
          { key: 'products', label: 'All Products', to: '/products' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading available vehicles...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileNav active="orders" links={[
        { key: 'orders', label: 'My Orders', to: '/orders' },
        { key: 'products', label: 'All Products', to: '/products' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Request Transport</h1>
              <p className="text-slate-600">Select a vehicle to deliver your order</p>
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
            {/* Vehicle List */}
            <div className="lg:col-span-2">
              {/* Filters */}
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="grid gap-3 md:grid-cols-4">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
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
                    onChange={(e) => setFilters(prev => ({ ...prev, minCapacity: e.target.value }))}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {districts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Cards */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-slate-500">Loading vehicles...</div>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                  <div className="text-6xl mb-4">🚛</div>
                  <p className="text-slate-500">No available vehicles found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map(vehicle => (
                    <div
                      key={vehicle._id}
                      className={`cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all hover:shadow-md ${
                        selectedVehicle?._id === vehicle._id
                          ? 'ring-2 ring-emerald-500 bg-emerald-50/30'
                          : 'ring-slate-200'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Vehicle Image */}
                        <div 
                          className="flex-shrink-0 cursor-pointer"
                          onClick={(e) => handleViewDetails(vehicle, e)}
                        >
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0].url}
                              alt={vehicle.brand}
                              className="h-24 w-24 rounded-xl object-cover border border-emerald-200"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-4xl">
                              {getCategoryIcon(vehicle.category)}
                            </div>
                          )}
                        </div>

                        {/* Vehicle Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-slate-900">
                                  {vehicle.brand} {vehicle.model}
                                </h3>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(vehicle.status)}`}>
                                  {vehicle.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{vehicle.vehicleId}</p>
                            </div>
                            {selectedVehicle?._id === vehicle._id && (
                              <span className="text-emerald-600 text-sm font-semibold">✓ Selected</span>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div>
                              <span className="text-slate-500">Category:</span>{' '}
                              <span className="font-semibold text-slate-900">{vehicle.category}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Type:</span>{' '}
                              <span className="font-semibold text-slate-900">{vehicle.vehicleType}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Fuel:</span>{' '}
                              <span className="font-semibold text-slate-900">{vehicle.fuelType}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Capacity:</span>{' '}
                              <span className="font-semibold text-slate-900">{vehicle.loadCapacity?.weight?.value || 'N/A'} kg</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500">📍 Transporter Location:</span>{' '}
                              <span className="font-semibold text-slate-900">
                                {vehicle.transporter?.location?.city || 'N/A'}, {vehicle.transporter?.location?.district || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleSelectVehicle(vehicle)}
                              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                selectedVehicle?._id === vehicle._id
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {selectedVehicle?._id === vehicle._id ? 'Selected' : 'Select Vehicle'}
                            </button>
                            <button
                              onClick={(e) => handleViewDetails(vehicle, e)}
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trip Request Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Transport Request</h2>
                
                {!selectedVehicle ? (
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
                        Transporter: {selectedVehicle.transporter?.businessName || selectedVehicle.transporter?.companyName || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Scheduled Pickup *</label>
                        <input
                          type="datetime-local"
                          value={tripForm.scheduledPickup}
                          onChange={(e) => setTripForm(prev => ({ ...prev, scheduledPickup: e.target.value }))}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Estimated Delivery *</label>
                        <input
                          type="datetime-local"
                          value={tripForm.estimatedDelivery}
                          onChange={(e) => setTripForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                          min={tripForm.scheduledPickup}
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Expected Delivery Fee (LKR) *</label>
                        <input
                          type="number"
                          placeholder="Enter your expected delivery fee"
                          value={tripForm.expectedDeliveryFee}
                          onChange={(e) => setTripForm(prev => ({ ...prev, expectedDeliveryFee: e.target.value }))}
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
      {showDetailsModal && selectedVehicle && (
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
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedVehicle.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`${selectedVehicle.brand} ${idx + 1}`}
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{getCategoryIcon(selectedVehicle.category)}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                    <p className="text-sm text-slate-500">{selectedVehicle.vehicleId}</p>
                  </div>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(selectedVehicle.status)}`}>
                  {selectedVehicle.status}
                </span>
              </div>

              {/* Specifications Grid */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.category}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Vehicle Type</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.vehicleType}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Registration Number</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.registrationNumber}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Fuel Type</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.fuelType}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Weight Capacity</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.loadCapacity?.weight?.value?.toLocaleString() || 'N/A'} kg</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Volume Capacity</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.loadCapacity?.volume?.value?.toLocaleString() || 'N/A'} L</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Manufacturing Year</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.manufacturingYear || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Transporter</p>
                  <p className="font-semibold text-slate-900">{selectedVehicle.transporter?.businessName || selectedVehicle.transporter?.companyName || 'N/A'}</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-2">📍 Transporter Location</p>
                <p className="text-slate-700">
                  {selectedVehicle.transporter?.location?.address || 'Address not available'}
                </p>
                <p className="text-slate-600 text-sm mt-1">
                  {selectedVehicle.transporter?.location?.city || 'N/A'}, {selectedVehicle.transporter?.location?.district || 'N/A'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleSelectVehicle(selectedVehicle);
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Select This Vehicle
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailableVehicles;