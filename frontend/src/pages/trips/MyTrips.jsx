import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';
import { fetchMyTrips, updateTripStatus, cancelTrip, fetchTripStats } from '../../api/trips';

const MyTrips = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    completionRate: 0,
    byStatus: []
  });
  const [activeStatus, setActiveStatus] = useState('All');
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
  }, [token, user, pagination.page, activeStatus]);

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

  const handleStatusUpdate = async (tripId, currentStatus, newStatus) => {
    const statusMessages = {
      Accepted: 'accept this trip',
      'In Progress': 'mark this trip as In Progress',
      Completed: 'complete this trip',
      Cancelled: 'cancel this trip'
    };
    
    const result = await Swal.fire({
      title: `Confirm ${newStatus}`,
      text: `Are you sure you want to ${statusMessages[newStatus] || 'update this trip'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${newStatus}`,
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await updateTripStatus(token, tripId, newStatus);
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `Trip ${newStatus.toLowerCase()} successfully`,
        confirmButtonColor: '#10b981',
        timer: 2000
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
        return ['Accept', 'Cancel'];
      case 'Accepted':
        return ['In Progress', 'Cancel'];
      case 'In Progress':
        return ['Completed'];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const statusTabs = ['All', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

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
              <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
              <p className="text-slate-600">Track and manage your delivery trips</p>
            </div>
            <Link
              to="/available-orders"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Find Available Orders
            </Link>
          </div>

          {/* Stats Cards */}
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

          {/* Status Tabs */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {statusTabs.map(status => (
              <button
                key={status}
                onClick={() => {
                  setActiveStatus(status);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Trips List */}
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
                const isCancellable = trip.tripStatus === 'Pending' || trip.tripStatus === 'Accepted';
                
                return (
                  <div
                    key={trip._id}
                    onClick={() => navigate(`/trips/${trip._id}`)}
                    className="cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-200"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Left: Trip Info */}
                      <div className="flex-1 space-y-3">
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
                        {actions.map(action => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(trip._id, trip.tripStatus, action);
                            }}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                              action === 'Cancel'
                                ? 'border border-red-200 text-red-700 hover:bg-red-50'
                                : action === 'Completed'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {action === 'In Progress' ? 'Start Trip' : action}
                          </button>
                        ))}
                        {isCancellable && !actions.includes('Cancel') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelTrip(trip._id);
                            }}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            Cancel Trip
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trips/${trip._id}`);
                          }}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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