import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const RequestOrderDelivery = () => {
  const { orderId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    proposedFare: '',
    scheduledPickup: '',
    estimatedDelivery: ''
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can request deliveries',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchOrderDetails();
    fetchMyVehicles();
  }, [token, user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const data = await res.json();
      setOrder(data.order);

      // Set default times
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const deliveryDate = new Date(tomorrow);
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      deliveryDate.setHours(17, 0, 0, 0);
      
      setFormData(prev => ({
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

  const fetchMyVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/vehicles?status=Available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      setVehicles(data.vehicles || []);
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

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({ ...prev, vehicleId: vehicle._id }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.proposedFare || !formData.scheduledPickup || !formData.estimatedDelivery) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const pickupDate = new Date(formData.scheduledPickup);
    const deliveryDate = new Date(formData.estimatedDelivery);

    if (deliveryDate <= pickupDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Dates',
        text: 'Delivery date must be after pickup date',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Submit Delivery Request',
      html: `
        <div style="text-align: left;">
          <p><strong>Order:</strong> ${order?.product?.productName || 'Order'}</p>
          <p><strong>Quantity:</strong> ${order?.quantity} ${order?.product?.unit}</p>
          <p><strong>Vehicle:</strong> ${selectedVehicle?.brand} ${selectedVehicle?.model}</p>
          <p><strong>Proposed Fare:</strong> LKR ${parseFloat(formData.proposedFare).toLocaleString()}</p>
          <p><strong>Pickup:</strong> ${pickupDate.toLocaleString()}</p>
          <p><strong>Delivery:</strong> ${deliveryDate.toLocaleString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Submit Request',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setRequesting(true);
    try {
      const payload = {
        orderId,
        vehicleId: formData.vehicleId,
        proposedFare: parseFloat(formData.proposedFare),
        scheduledPickup: formData.scheduledPickup,
        estimatedDelivery: formData.estimatedDelivery
      };

      const res = await fetch(`${API_BASE_URL}/api/trips/request-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      Swal.fire({
        icon: 'success',
        title: 'Request Submitted!',
        text: 'Your delivery request has been submitted. Waiting for distributor acceptance.',
        confirmButtonColor: '#10b981',
        timer: 3000
      });

      navigate('/trips');
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

  if (loading || !order) {
    return (
      <>
        <ProfileNav active="trips" />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-7xl text-center py-12">
            <div className="text-slate-500">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileNav active="trips" />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Request Delivery</h1>
            <p className="text-slate-600">Submit a delivery request for an available order</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Order Details */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-white p-6 shadow-sm sticky top-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Order Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="border-b border-slate-200 pb-3">
                    <p className="text-slate-600">Product</p>
                    <p className="font-semibold text-slate-900">{order?.product?.productName}</p>
                  </div>

                  <div className="border-b border-slate-200 pb-3">
                    <p className="text-slate-600">Farmer</p>
                    <p className="font-semibold text-slate-900">{order?.product?.farmer?.fullName}</p>
                  </div>

                  <div className="border-b border-slate-200 pb-3">
                    <p className="text-slate-600">Quantity</p>
                    <p className="font-semibold text-slate-900">{order?.quantity} {order?.product?.unit}</p>
                  </div>

                  <div className="border-b border-slate-200 pb-3">
                    <p className="text-slate-600">Pickup Location</p>
                    <p className="font-semibold text-slate-900">{order?.product?.pickupLocation?.address}</p>
                  </div>

                  <div>
                    <p className="text-slate-600">Delivery Location</p>
                    <p className="font-semibold text-slate-900">{order?.deliveryAddress?.addressLine}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Selection */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Select Vehicle</h3>
                  
                  {vehicles.length === 0 ? (
                    <p className="text-slate-500">No available vehicles</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {vehicles.map(vehicle => (
                        <div
                          key={vehicle._id}
                          onClick={() => handleVehicleSelect(vehicle)}
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
                            <p>📦 {vehicle.category}</p>
                            <p>⚖️ {vehicle.loadCapacity?.weight?.value} {vehicle.loadCapacity?.weight?.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Details */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Delivery Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Scheduled Pickup *
                      </label>
                      <input
                        type="datetime-local"
                        name="scheduledPickup"
                        value={formData.scheduledPickup}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estimated Delivery *
                      </label>
                      <input
                        type="datetime-local"
                        name="estimatedDelivery"
                        value={formData.estimatedDelivery}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Proposed Fare (LKR) *
                      </label>
                      <input
                        type="number"
                        name="proposedFare"
                        value={formData.proposedFare}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2"
                        required
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/trips/available-orders')}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requesting || !selectedVehicle}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                  >
                    {requesting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestOrderDelivery;
