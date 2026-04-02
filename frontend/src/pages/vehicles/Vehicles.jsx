import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const Vehicles = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    available: 0,
    onDelivery: 0,
    maintenance: 0,
    expired: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  });

  const categories = ['All', 'Truck', 'Lorry', 'Pickup', 'Van'];
  const statuses = ['All', 'Available', 'On Delivery', 'Maintenance', 'Offline'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can access this page',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchVehicles();
  }, [token, user, pagination.page, filters.status, filters.category]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const transporterId = profileData.user?._id;

      if (!transporterId) {
        throw new Error('Transporter ID not found');
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        transporterId: transporterId,
        ...(filters.status && filters.status !== 'All' && { status: filters.status }),
        ...(filters.category && filters.category !== 'All' && { category: filters.category })
      });

      const res = await fetch(`http://localhost:3000/api/vehicles?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch vehicles');

      const data = await res.json();
      setVehicles(data.vehicles || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages
      });

      const allVehicles = data.vehicles || [];
      const available = allVehicles.filter(v => v.status === 'Available').length;
      const onDelivery = allVehicles.filter(v => v.status === 'On Delivery').length;
      const maintenance = allVehicles.filter(v => v.status === 'Maintenance').length;
      
      // Count expired vehicles (insurance or registration expired)
      const today = new Date();
      const expired = allVehicles.filter(v => 
        (v.insuranceExpiry && new Date(v.insuranceExpiry) < today) ||
        (v.registrationExpiry && new Date(v.registrationExpiry) < today)
      ).length;

      setStats({
        totalVehicles: data.total,
        available,
        onDelivery,
        maintenance,
        expired
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const handleDelete = async (vehicleId, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: 'Delete Vehicle',
      text: 'Are you sure you want to delete this vehicle? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const profileRes = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const transporterId = profileData.user?._id;

      const res = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transporterId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete vehicle');
      }

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Vehicle has been deleted successfully.',
        confirmButtonColor: '#10b981',
        timer: 2000
      });
      
      fetchVehicles();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    }
  };

  const updateStatus = async (vehicleId, currentStatus, newStatus, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: 'Update Status',
      text: `Change vehicle status to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const profileRes = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const transporterId = profileData.user?._id;

      const res = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transporterId, status: newStatus })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `Vehicle status updated to ${newStatus}`,
        confirmButtonColor: '#10b981',
        timer: 2000
      });
      
      fetchVehicles();
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
      case 'Available': return 'bg-green-100 text-green-700';
      case 'On Delivery': return 'bg-blue-100 text-blue-700';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'Offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const isExpired = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };

  return (
    <>
      <ProfileNav active="vehicles" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' },
        { key: 'available', label: 'Available Orders', to: '/available-orders' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header with Refresh Button */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Vehicles</h1>
              <p className="text-slate-600">Manage your fleet and vehicle availability</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <Link
                to="/vehicles/add"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                + Add New Vehicle
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total Fleet</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.totalVehicles}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-3xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">On Delivery</p>
              <p className="text-3xl font-bold text-blue-600">{stats.onDelivery}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Expired Docs</p>
              <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setFilters({ category: 'All', status: 'All' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setTimeout(fetchVehicles, 100);
                }}
                className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Vehicles Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading your vehicles...</div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-6xl mb-4">🚛</div>
              <p className="text-slate-500 mb-4">You haven't added any vehicles yet.</p>
              <Link
                to="/vehicles/add"
                className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Add Your First Vehicle
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map(vehicle => {
                const hasExpiredInsurance = isExpired(vehicle.insuranceExpiry);
                const hasExpiredRegistration = isExpired(vehicle.registrationExpiry);
                const isExpiredVehicle = hasExpiredInsurance || hasExpiredRegistration;
                
                return (
                  <div 
                    key={vehicle._id} 
                    onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                    className={`group cursor-pointer rounded-2xl bg-white shadow-sm ring-1 transition hover:shadow-md hover:ring-emerald-200 ${
                      isExpiredVehicle ? 'ring-2 ring-red-300 bg-red-50/30' : 'ring-slate-200'
                    }`}
                  >
                    {/* Vehicle Header */}
                    <div className="relative p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getCategoryIcon(vehicle.category)}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-500">{vehicle.vehicleId}</p>
                            <h3 className="text-lg font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h3>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                      
                      {/* Expiry Warning Badges */}
                      {(hasExpiredInsurance || hasExpiredRegistration) && (
                        <div className="mt-2 flex gap-2">
                          {hasExpiredInsurance && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              ⚠️ Insurance Expired
                            </span>
                          )}
                          {hasExpiredRegistration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              ⚠️ Registration Expired
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Registration</p>
                          <p className="font-semibold text-slate-900">{vehicle.registrationNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Type</p>
                          <p className="font-semibold text-slate-900">{vehicle.vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Fuel Type</p>
                          <p className="font-semibold text-slate-900">{vehicle.fuelType}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Capacity</p>
                          <p className="font-semibold text-slate-900">{vehicle.loadCapacity?.weight?.value || 'N/A'} kg</p>
                        </div>
                      </div>

                      {/* Maintenance Info */}
                      {(vehicle.nextMaintenanceDue || vehicle.insuranceExpiry || vehicle.registrationExpiry) && (
                        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs space-y-1">
                          {vehicle.nextMaintenanceDue && (
                            <p className="text-amber-700">
                              🔧 Next Maintenance: {new Date(vehicle.nextMaintenanceDue).toLocaleDateString()}
                            </p>
                          )}
                          {vehicle.insuranceExpiry && (
                            <p className={hasExpiredInsurance ? 'text-red-700 font-semibold' : 'text-amber-700'}>
                              📄 Insurance Expires: {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                              {hasExpiredInsurance && ' (EXPIRED)'}
                            </p>
                          )}
                          {vehicle.registrationExpiry && (
                            <p className={hasExpiredRegistration ? 'text-red-700 font-semibold' : 'text-amber-700'}>
                              🚗 Registration Expires: {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                              {hasExpiredRegistration && ' (EXPIRED)'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Vehicle Image Preview */}
                      {vehicle.images && vehicle.images.length > 0 && (
                        <div className="mt-2">
                          <img
                            src={vehicle.images[0].url}
                            alt={vehicle.brand}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/vehicles/edit/${vehicle._id}`}
                          className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Edit
                        </Link>
                        <select
                          value={vehicle.status}
                          onChange={(e) => updateStatus(vehicle._id, vehicle.status, e.target.value, e)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:border-emerald-500 focus:outline-none"
                          disabled={isExpiredVehicle}
                        >
                          <option value="Available">Set Available</option>
                          <option value="On Delivery">Set On Delivery</option>
                          <option value="Maintenance">Set Maintenance</option>
                          <option value="Offline">Set Offline</option>
                        </select>
                        <button
                          onClick={(e) => handleDelete(vehicle._id, e)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                      {isExpiredVehicle && (
                        <p className="text-center text-xs text-red-600 mt-2">
                          ⚠️ Vehicle automatically set to Offline due to expired documents
                        </p>
                      )}
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

export default Vehicles;