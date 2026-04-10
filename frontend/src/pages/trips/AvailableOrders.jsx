import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';
import { fetchAvailableOrders, createTrip, fetchMyVehicles } from '../../api/trips';

const AvailableOrders = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [tripForm, setTripForm] = useState({
    vehicleId: '',
    scheduledPickup: '',
    estimatedDelivery: '',
    baseFare: '',
    distanceCharge: '0'
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
        text: 'Only transporters can view available orders',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    loadOrders();
    loadVehicles();
  }, [token, user, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAvailableOrders(token, pagination.page, pagination.limit);
      setOrders(data.orders || []);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        pages: data.pages
      }));
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

  const loadVehicles = async () => {
    try {
      const data = await fetchMyVehicles(token);
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const openCreateForm = (order) => {
    setSelectedOrder(order);

    // Set default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const deliveryDate = new Date(tomorrow);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    deliveryDate.setHours(17, 0, 0, 0);

    setTripForm({
      vehicleId: vehicles.length === 1 ? vehicles[0]._id : '',
      scheduledPickup: tomorrow.toISOString().slice(0, 16),
      estimatedDelivery: deliveryDate.toISOString().slice(0, 16),
      baseFare: '',
      distanceCharge: '0'
    });

    setShowCreateForm(true);
  };

  const handleCreateTrip = async () => {
    if (!tripForm.vehicleId) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Vehicle',
        text: 'Please select a vehicle for this delivery',
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

    if (!tripForm.baseFare || parseFloat(tripForm.baseFare) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Fare',
        text: 'Please enter a valid base fare',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Create Trip',
      html: `
        <div style="text-align: left;">
          <p><strong>Order:</strong> ${selectedOrder?.product?.productName}</p>
          <p><strong>Vehicle:</strong> ${vehicles.find(v => v._id === tripForm.vehicleId)?.brand} ${vehicles.find(v => v._id === tripForm.vehicleId)?.model}</p>
          <p><strong>Total Fare:</strong> LKR ${(parseFloat(tripForm.baseFare) + parseFloat(tripForm.distanceCharge || 0)).toLocaleString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Create Trip',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setCreating(true);
    try {
      const payload = {
        orderId: selectedOrder._id,
        vehicleId: tripForm.vehicleId,
        scheduledPickup: tripForm.scheduledPickup,
        estimatedDelivery: tripForm.estimatedDelivery,
        baseFare: parseFloat(tripForm.baseFare),
        distanceCharge: parseFloat(tripForm.distanceCharge || 0),
        additionalCharges: []
      };

      await createTrip(token, payload);

      Swal.fire({
        icon: 'success',
        title: 'Trip Created!',
        text: 'Trip has been created successfully. The distributor will be notified.',
        confirmButtonColor: '#10b981'
      });

      setShowCreateForm(false);
      setSelectedOrder(null);
      loadOrders();
      loadVehicles();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <ProfileNav active="available" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' },
        { key: 'available', label: 'Available Orders', to: '/available-orders' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Available Orders</h1>
              <p className="text-slate-600">Orders ready for transport. Create trips to deliver them.</p>
            </div>
            <Link
              to="/trips"
              className="rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              View My Trips →
            </Link>
          </div>

          {/* Vehicle Alert */}
          {vehicles.length === 0 && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-amber-700 border border-amber-200">
              <p className="font-semibold">⚠️ No vehicles available</p>
              <p className="text-sm">Please add a vehicle before creating trips.</p>
              <Link to="/vehicles/add" className="text-sm font-semibold underline mt-1 inline-block">
                Add Vehicle →
              </Link>
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading available orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-slate-500 mb-4">No orders available for transport at the moment.</p>
              <p className="text-sm text-slate-400">Check back later for new orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left: Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-28 w-full max-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          {order.product?.images?.[0] ? (
                            <img
                              src={order.product.images[0]}
                              alt={order.product?.productName || 'Product Image'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{order.product?.productName || 'Product'}</h3>
                          <p className="text-sm text-slate-500">Order ID: {order._id.slice(-8)}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Quantity</p>
                          <p className="font-semibold text-slate-900">{order.quantity} {order.product?.unit || 'kg'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Order Value</p>
                          <p className="font-semibold text-slate-900">LKR {order.totalPrice?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Placed On</p>
                          <p className="font-semibold text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-lg bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-blue-700 uppercase">Pickup Location (Farmer)</p>
                          <p className="font-semibold text-slate-900">{order.product?.pickupLocation?.district || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{order.product?.pickupLocation?.address?.slice(0, 60)}...</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-700 uppercase">Delivery Location (Distributor)</p>
                          <p className="font-semibold text-slate-900">{order.deliveryAddress?.city || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{order.deliveryAddress?.addressLine?.slice(0, 60)}...</p>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-slate-500">Distributor</p>
                        <p className="font-semibold text-slate-900">{order.distributor?.fullName || 'N/A'} - {order.distributor?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="min-w-[200px] flex flex-col gap-2">
                      <Link
                        to={`/create-trip/${order._id}`}
                        className={`w-full rounded-xl px-4 py-2.5 text-center font-semibold text-white transition ${vehicles.length === 0
                            ? 'bg-gray-400 cursor-not-allowed pointer-events-none'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        onClick={(e) => {
                          if (vehicles.length === 0) {
                            e.preventDefault();
                            Swal.fire({
                              icon: 'warning',
                              title: 'No Vehicles Available',
                              text: 'Please add a vehicle before requesting delivery.',
                              confirmButtonColor: '#10b981'
                            });
                          }
                        }}
                      >
                        Request Delivery
                      </Link>
                      <p className="text-xs text-slate-400 text-center">
                        {vehicles.length === 0 ? 'Add a vehicle first' : 'Submit request to distributor'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Trip Modal */}
      {showCreateForm && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowCreateForm(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-xl font-bold text-slate-900">Create Trip</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{selectedOrder.product?.productName}</p>
                <p className="text-slate-600">Qty: {selectedOrder.quantity} {selectedOrder.product?.unit}</p>
                <p className="text-slate-600">From: {selectedOrder.product?.pickupLocation?.district}</p>
                <p className="text-slate-600">To: {selectedOrder.deliveryAddress?.city}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Select Vehicle *</label>
                <select
                  value={tripForm.vehicleId}
                  onChange={(e) => setTripForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.brand} {v.model} - {v.registrationNumber} ({v.loadCapacity?.weight?.value || 0}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Scheduled Pickup *</label>
                <input
                  type="datetime-local"
                  value={tripForm.scheduledPickup}
                  onChange={(e) => setTripForm(prev => ({ ...prev, scheduledPickup: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Estimated Delivery *</label>
                <input
                  type="datetime-local"
                  value={tripForm.estimatedDelivery}
                  onChange={(e) => setTripForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  min={tripForm.scheduledPickup}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Base Fare (LKR) *</label>
                <input
                  type="number"
                  placeholder="Enter base fare"
                  value={tripForm.baseFare}
                  onChange={(e) => setTripForm(prev => ({ ...prev, baseFare: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Distance Charge (LKR)</label>
                <input
                  type="number"
                  placeholder="Enter distance charge (optional)"
                  value={tripForm.distanceCharge}
                  onChange={(e) => setTripForm(prev => ({ ...prev, distanceCharge: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex justify-between font-bold">
                  <span>Total Fare:</span>
                  <span className="text-emerald-600">
                    LKR {(parseFloat(tripForm.baseFare || 0) + parseFloat(tripForm.distanceCharge || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateTrip}
                  disabled={creating}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Trip'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailableOrders;