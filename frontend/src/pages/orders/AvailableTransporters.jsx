import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Filters */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vehicle Category
                    </label>
                    <select
                      value={filters.vehicleCategory}
                      onChange={(e) => setFilters({ ...filters, vehicleCategory: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={filters.vehicleType}
                      onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Min Weight Capacity (kg)
                    </label>
                    <input
                      type="number"
                      value={filters.minCapacity}
                      onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                      placeholder="e.g., 1000"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      District
                    </label>
                    <select
                      value={filters.district}
                      onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {districts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {transporters.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                  <p className="text-slate-500">No available transporters found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transporters.map(transporter => (
                    <div key={transporter._id} className="rounded-xl bg-white p-6 shadow-sm">
                      {/* Transporter Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {transporter.businessName || transporter.companyName}
                          </h3>
                          <p className="text-sm text-slate-600">
                            📍 {transporter.location?.city}, {transporter.location?.district}
                          </p>
                          <p className="text-sm text-slate-600">
                            📞 {transporter.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-600">
                            {transporter.vehicles.length} vehicle{transporter.vehicles.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>

                      {/* Vehicles List */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {transporter.vehicles.map(vehicle => (
                          <div
                            key={vehicle._id}
                            onClick={() => handleSelectVehicle(vehicle, transporter)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                              selectedVehicle?._id === vehicle._id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-2xl">{getCategoryIcon(vehicle.category)}</span>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {vehicle.brand} {vehicle.model}
                                </p>
                                <p className="text-xs text-slate-600">{vehicle.vehicleId}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                              <p>📦 Category: {vehicle.category}</p>
                              <p>🏗️ Type: {vehicle.vehicleType}</p>
                              <p>⚖️ Weight Capacity: {vehicle.loadCapacity?.weight?.value || 'N/A'} {vehicle.loadCapacity?.weight?.unit || 'kg'}</p>
                              <p>📏 Volume: {vehicle.loadCapacity?.volume?.value || 'N/A'} {vehicle.loadCapacity?.volume?.unit || 'L'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trip Form */}
          {selectedVehicle && selectedTransporter && (
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-6 shadow-lg">
              <div className="mx-auto max-w-7xl">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Scheduled Pickup
                    </label>
                    <input
                      type="datetime-local"
                      value={tripForm.scheduledPickup}
                      onChange={(e) => setTripForm({ ...tripForm, scheduledPickup: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated Delivery
                    </label>
                    <input
                      type="datetime-local"
                      value={tripForm.estimatedDelivery}
                      onChange={(e) => setTripForm({ ...tripForm, estimatedDelivery: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Proposed Fare (LKR)
                    </label>
                    <input
                      type="number"
                      value={tripForm.proposedFare}
                      onChange={(e) => setTripForm({ ...tripForm, proposedFare: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    onClick={handleRequestTrip}
                    disabled={requesting}
                    className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                  >
                    {requesting ? 'Sending...' : 'Request Transport'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AvailableTransporters;
