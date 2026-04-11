import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';
import { fetchMyTrips, updateTripStatus, cancelTrip, fetchTripStats, updateVehicleStatus } from '../../api/trips';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyTrips = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    completionRate: 0,
    byStatus: []
  });
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' or 'requests'
  const [activeStatus, setActiveStatus] = useState('All');
  const [loadingTripId, setLoadingTripId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
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
        text: 'Only transporters can access trips',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    loadTrips();
    loadStats();
    loadRequests();
  }, [token, user, pagination.page, activeStatus, activeTab, requestFilter]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const statusParam = activeStatus === 'All' ? '' : activeStatus;
      const data = await fetchMyTrips(token, pagination.page, pagination.limit, statusParam);
      setTrips(data.trips || []);
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

  const loadStats = async () => {
    try {
      const data = await fetchTripStats(token);
      setStats(data.stats || {
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        completionRate: 0,
        byStatus: []
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRequests = async () => {
    if (activeTab !== 'requests') return;
    try {
      const params = new URLSearchParams({
        status: requestFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      const res = await fetch(`${API_BASE_URL}/api/trips/incoming-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.requests || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        pages: Math.ceil((data.total || 0) / pagination.limit)
      }));
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await Swal.fire({
      title: 'Accept Request',
      text: 'Are you sure you want to accept this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to accept request');
      }

      Swal.fire({
        icon: 'success',
        title: 'Accepted!',
        text: 'Request has been accepted successfully',
        confirmButtonColor: '#10b981',
        timer: 2000
      });

      loadRequests();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Request',
      input: 'textarea',
      inputPlaceholder: 'Reason for rejection (optional)',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel'
    });

    if (reason === undefined) return;

    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rejectionReason: reason || 'No reason provided'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject request');
      }

      Swal.fire({
        icon: 'success',
        title: 'Rejected!',
        text: 'Request has been rejected',
        confirmButtonColor: '#10b981',
        timer: 2000
      });

      loadRequests();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusUpdate = async (tripId, currentStatus, newStatus) => {
    const statusMessages = {
      'Confirm Trip': 'confirm and prepare this trip',
      'Start Trip': 'start this trip (mark vehicle as On Delivery)',
      'Completed': 'complete this trip (mark vehicle as Available)',
      'Cancel': 'cancel this trip',
      'Cancelled': 'cancel this trip'
    };
    
    // Map action labels to actual API status values
    const statusMap = {
      'Confirm Trip': 'Confirmed',
      'Start Trip': 'In Progress',
      'In Progress': 'In Progress',
      'Completed': 'Completed'
    };

    const displayStatus = newStatus === 'In Progress' ? 'Start Trip' : newStatus;
    const apiStatus = statusMap[newStatus] || newStatus;

    const result = await Swal.fire({
      title: `Confirm ${displayStatus}`,
      text: `Are you sure you want to ${statusMessages[displayStatus] || 'update this trip'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${displayStatus}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setLoadingTripId(tripId);
    try {
      await updateTripStatus(token, tripId, apiStatus);
      
      // Get the trip to get vehicle ID
      const trip = trips.find(t => t._id === tripId);
      const vehicleId = trip?.vehicle?._id ?? trip?.vehicle;
      if (vehicleId) {
        if (apiStatus === 'In Progress') {
          await updateVehicleStatus(token, vehicleId, 'On Delivery');
        } else if (apiStatus === 'Completed') {
          await updateVehicleStatus(token, vehicleId, 'Available');
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `Trip ${displayStatus.toLowerCase()} successfully`,
      });
      loadTrips();
      loadStats();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleCancelTrip = async (tripId) => {
    const { value: reason } = await Swal.fire({
      title: 'Cancel Trip',
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Enter cancellation reason...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Cancel Trip',
      cancelButtonText: 'Back'
    });

    if (reason === undefined) return;

    setLoadingTripId(tripId);
    try {
      await cancelTrip(token, tripId, reason);
      Swal.fire({
        icon: 'success',
        title: 'Cancelled',
        text: 'Trip cancelled successfully',
        confirmButtonColor: '#10b981'
      });
      loadTrips();
      loadStats();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoadingTripId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Accepted': return 'bg-blue-100 text-blue-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Accepted': return '✓';
      case 'In Progress': return '🚚';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

  const getAvailableActions = (status) => {
    switch (status) {
      case 'Pending':
        return []; // Waiting for distributor approval, no actions
      case 'Accepted':
        return ['Confirm Trip']; // Distributor accepted, transporter can confirm
      case 'Confirmed':
        return ['In Progress']; // Start the trip
      case 'In Progress':
        return ['Completed']; // Complete the delivery
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusMessage = (trip) => {
    // Check if this trip was created by the transporter (requesting from distributor)
    // or by the distributor (requesting from transporter)
    if (trip.tripStatus === 'Pending') {
      // If createdBy is the transporter, waiting for distributor approval
      // If createdBy is the distributor, waiting for transporter acceptance
      if (trip.createdBy === 'transporter' || trip.transporter?._id) {
        return '⏳ Waiting for distributor approval...';
      } else {
        return '⏳ Pending Your Response - Accept or Reject';
      }
    }
    return null;
  };

  const statusTabs = ['All', 'Pending', 'Accepted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <>
      <ProfileNav active="trips" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' },
        { key: 'available', label: 'Available Orders', to: '/available-orders' },
        { key: 'requests', label: 'Incoming Requests', to: '/incoming-requests' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {activeTab === 'trips' ? 'My Trips' : 'Incoming Requests'}
              </h1>
              <p className="text-slate-600">
                {activeTab === 'trips' ? 'Track and manage your delivery trips' : 'View and manage requests from distributors'}
              </p>
            </div>
            {activeTab === 'trips' && (
              <Link
                to="/available-orders"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                + Find Available Orders
              </Link>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-slate-200 pb-4">
            <button
              onClick={() => {
                setActiveTab('trips');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'trips'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📦 My Trips
            </button>
            <button
              onClick={() => {
                setActiveTab('requests');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'requests'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📥 Incoming Requests
            </button>
          </div>

          {/* Stats Cards - Only for Trips Tab */}
          {activeTab === 'trips' && (
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Total Trips</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalTrips}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedTrips}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Cancelled</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelledTrips}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completionRate}%</p>
              </div>
            </div>
          )}

          {/* Status Tabs - Only for Trips Tab */}
          {activeTab === 'trips' && (
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {statusTabs.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatus(status);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {/* Request Filters - Only for Requests Tab */}
          {activeTab === 'requests' && (
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {['pending', 'accepted', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setRequestFilter(status);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${requestFilter === status
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {/* Trips List */}
          {activeTab === 'trips' && (
            <>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-slate-500">Loading trips...</div>
                </div>
              ) : trips.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                  <div className="text-6xl mb-4">🚚</div>
                  <p className="text-slate-500 mb-4">No trips found</p>
                  <Link
                    to="/available-orders"
                    className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700"
                  >
                    Browse Available Orders
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map(trip => {
                const actions = getAvailableActions(trip.tripStatus);

                return (
                  <div
                    key={trip._id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-200"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Left: Trip Info (Clickable) */}
                      <div
                        className="flex-1 space-y-3 cursor-pointer"
                        onClick={() => navigate(`/trips/${trip._id}`)}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="h-28 w-full max-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {trip.order?.product?.images?.[0] ? (
                              <img
                                src={trip.order.product.images[0]}
                                alt={trip.order?.product?.productName || 'Product Image'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getStatusIcon(trip.tripStatus)}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-slate-900">Trip #{trip.tripId || trip._id.slice(-6)}</h3>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(trip.tripStatus)}`}>
                                    {trip.tripStatus}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                  Created: {formatDate(trip.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-slate-500">Order</p>
                            <p className="font-semibold text-slate-900">
                              {trip.order?.product?.productName || 'N/A'} - {trip.order?.quantity || 0} {trip.order?.product?.unit || 'kg'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Vehicle</p>
                            <p className="font-semibold text-slate-900">
                              {trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.registrationNumber})
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Pickup</p>
                            <p className="font-semibold text-slate-900">{trip.pickupLocation?.address?.slice(0, 50)}...</p>
                            <p className="text-xs text-slate-400">{formatDate(trip.schedule?.scheduledPickup)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Delivery</p>
                            <p className="font-semibold text-slate-900">{trip.dropoffLocation?.address?.slice(0, 50)}...</p>
                            <p className="text-xs text-slate-400">{formatDate(trip.schedule?.estimatedDelivery)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div className="rounded-lg bg-emerald-50 px-3 py-1">
                            <span className="text-sm font-bold text-emerald-700">
                              LKR {trip.costs?.totalCost?.toLocaleString() || 0}
                            </span>
                          </div>
                          {trip.schedule?.actualPickup && (
                            <div className="rounded-lg bg-blue-50 px-3 py-1">
                              <span className="text-xs text-blue-700">
                                Picked: {new Date(trip.schedule.actualPickup).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {trip.schedule?.actualDelivery && (
                            <div className="rounded-lg bg-green-50 px-3 py-1">
                              <span className="text-xs text-green-700">
                                Delivered: {new Date(trip.schedule.actualDelivery).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                        {trip.tripStatus === 'Pending' && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 font-medium">
                            {getStatusMessage(trip)}
                          </div>
                        )}
                        
                        {actions.map(action => (
                          <button
                            key={action}
                            onClick={() => handleStatusUpdate(trip._id, trip.tripStatus, action)}
                            disabled={loadingTripId === trip._id}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                              loadingTripId === trip._id 
                                ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
                                : action === 'In Progress' 
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : action === 'Completed'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {loadingTripId === trip._id ? '⏳ Updating...' : (action === 'In Progress' ? 'Start Trip' : action)}
                          </button>
                        ))}
                        
                        {(trip.tripStatus === 'Pending' || trip.tripStatus === 'Accepted') && (
                          <button
                            onClick={() => handleCancelTrip(trip._id)}
                            disabled={loadingTripId === trip._id}
                            className={`rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold transition ${
                              loadingTripId === trip._id 
                                ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-300'
                                : 'text-red-700 hover:bg-red-50'
                            }`}
                          >
                            {loadingTripId === trip._id ? '⏳ Processing...' : 'Cancel Trip'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/trips/${trip._id}`)}
                          disabled={loadingTripId === trip._id}
                          className={`rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold transition ${
                            loadingTripId === trip._id 
                              ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-300'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </>
          )}

          {/* Requests List */}
          {activeTab === 'requests' && (
            <>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-slate-500">Loading requests...</div>
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-slate-500">No {requestFilter} requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => (
                    <div key={request._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
                      <div className="grid gap-6 lg:grid-cols-4">
                        {/* Request Info */}
                        <div className="lg:col-span-2">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {request.order?.product?.productName}
                              </h3>
                              <p className="text-sm text-slate-600">📥 Distributor Request</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              request.requestStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              request.requestStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {request.requestStatus}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-slate-600">
                            <p><strong>Order:</strong> Order #{request.order?._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                            <p><strong>Quantity:</strong> {request.order?.quantity} {request.order?.product?.unit}</p>
                            <p><strong>Distributor:</strong> {request.proposedBy?.businessName || request.proposedBy?.fullName}</p>
                            {request.order?.product?.pickupLocation?.instructions && (
                              <div className="mt-2 rounded-lg bg-blue-100 p-2">
                                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">📋 Pickup Instructions</p>
                                <p className="text-xs text-blue-800">{request.order.product.pickupLocation.instructions}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="lg:col-span-1">
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-slate-600">Pickup</p>
                              <p className="font-semibold text-slate-900">
                                {new Date(request.schedule?.scheduledPickup).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Delivery</p>
                              <p className="font-semibold text-slate-900">
                                {new Date(request.schedule?.estimatedDelivery).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Fare & Actions */}
                        <div className="lg:col-span-1">
                          <div className="mb-4">
                            <p className="text-sm text-slate-600">Proposed Fare</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              LKR {request.costs?.totalCost?.toLocaleString() || '0'}
                            </p>
                          </div>

                          {request.requestStatus === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(request._id)}
                                disabled={processingId === request._id}
                                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                              >
                                {processingId === request._id ? '⏳' : '✓ Accept'}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                disabled={processingId === request._id}
                                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
                              >
                                {processingId === request._id ? '⏳' : '✕ Reject'}
                              </button>
                            </div>
                          )}

                          {request.requestStatus === 'accepted' && (
                            <button
                              onClick={() => navigate(`/trips/${request._id}`)}
                              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              View Trip
                            </button>
                          )}

                          {request.requestStatus === 'rejected' && (
                            <div className="rounded-lg bg-red-50 p-2">
                              <p className="text-xs text-red-700">
                                <strong>Reason:</strong> {request.rejectionReason || 'No reason provided'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
    </>
  );
};

export default MyTrips;