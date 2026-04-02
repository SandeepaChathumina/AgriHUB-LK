import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const VehicleDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can view vehicle details',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchVehicleDetails();
  }, [token, user, id]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'Not Found',
            text: 'Vehicle not found',
            confirmButtonColor: '#10b981'
          });
          navigate('/vehicles');
          return;
        }
        throw new Error('Failed to fetch vehicle details');
      }

      const data = await res.json();
      setVehicle(data.vehicle);
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

  const updateStatus = async (newStatus) => {
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

    setUpdatingStatus(true);
    try {
      const profileRes = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const transporterId = profileData.user?._id;

      const res = await fetch(`http://localhost:3000/api/vehicles/${id}/status`, {
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
      
      fetchVehicleDetails();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Vehicle',
      html: `Are you sure you want to delete <strong>${vehicle?.brand} ${vehicle?.model}</strong>?<br/>This action cannot be undone.`,
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

      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, {
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
        text: 'Vehicle has been deleted successfully',
        confirmButtonColor: '#10b981'
      });
      
      navigate('/vehicles');
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
      case 'Available': return 'bg-green-100 text-green-700 border-green-200';
      case 'On Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const today = new Date();
    const expiryDate = new Date(date);
    const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30 && daysDiff > 0;
  };

  if (loading) {
    return (
      <>
        <ProfileNav active="vehicles" links={[
          { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
          { key: 'trips', label: 'Trips', to: '/trips' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading vehicle details...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!vehicle) {
    return null;
  }

  const hasExpiredInsurance = isExpired(vehicle.insuranceExpiry);
  const hasExpiredRegistration = isExpired(vehicle.registrationExpiry);
  const isExpiredVehicle = hasExpiredInsurance || hasExpiredRegistration;

  return (
    <>
      <ProfileNav active="vehicles" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'Trips', to: '/trips' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/vehicles')}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Vehicles
          </button>

          {/* Vehicle Header Card */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className={`relative bg-gradient-to-r ${isExpiredVehicle ? 'from-red-600 to-red-800' : 'from-emerald-600 to-emerald-800'} px-6 py-8 text-white`}>
              <div className="absolute right-6 top-6 text-6xl opacity-20">
                {getCategoryIcon(vehicle.category)}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{getCategoryIcon(vehicle.category)}</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">{vehicle.vehicleId}</p>
                    <h1 className="text-3xl font-bold">{vehicle.brand} {vehicle.model}</h1>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusColor(vehicle.status)} bg-opacity-90`}>
                    {vehicle.status}
                  </span>
                  <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
                    {vehicle.category}
                  </span>
                  <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
                    {vehicle.vehicleType}
                  </span>
                </div>
                {isExpiredVehicle && (
                  <div className="mt-3 flex gap-2">
                    {hasExpiredInsurance && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold">
                        ⚠️ Insurance Expired
                      </span>
                    )}
                    {hasExpiredRegistration && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold">
                        ⚠️ Registration Expired
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Registration</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900">{vehicle.registrationNumber}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Fuel Type</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{vehicle.fuelType}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Images Gallery */}
          {vehicle.images && vehicle.images.length > 0 && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Vehicle Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vehicle.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedImage(image.url);
                      setShowImageModal(true);
                    }}
                    className="cursor-pointer overflow-hidden rounded-lg border border-emerald-200 hover:shadow-md transition"
                  >
                    <img
                      src={image.url}
                      alt={`Vehicle ${index + 1}`}
                      className="h-32 w-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Specifications */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Weight Capacity</span>
                  <span className="font-semibold text-slate-900">{vehicle.loadCapacity?.weight?.value?.toLocaleString() || 'N/A'} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Volume Capacity</span>
                  <span className="font-semibold text-slate-900">{vehicle.loadCapacity?.volume?.value?.toLocaleString() || 'N/A'} L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Manufacturing Year</span>
                  <span className="font-semibold text-slate-900">{vehicle.manufacturingYear || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Vehicle Type</span>
                  <span className="font-semibold text-slate-900">{vehicle.vehicleType}</span>
                </div>
              </div>
            </div>

            {/* Maintenance Status */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2m-4-8a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Maintenance Schedule</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Last Maintenance</span>
                  <span className="font-semibold text-slate-900">{formatDate(vehicle.lastMaintenanceDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Next Maintenance Due</span>
                  <span className={`font-semibold ${isExpiringSoon(vehicle.nextMaintenanceDue) && !isExpired(vehicle.nextMaintenanceDue) ? 'text-amber-600' : isExpired(vehicle.nextMaintenanceDue) ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatDate(vehicle.nextMaintenanceDue)}
                    {isExpiringSoon(vehicle.nextMaintenanceDue) && !isExpired(vehicle.nextMaintenanceDue) && (
                      <span className="ml-2 text-xs text-amber-600">(Due soon)</span>
                    )}
                    {isExpired(vehicle.nextMaintenanceDue) && (
                      <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Insurance & Registration */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Insurance & Registration</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Insurance Expiry</span>
                  <span className={`font-semibold ${
                    isExpired(vehicle.insuranceExpiry) ? 'text-red-600' : 
                    isExpiringSoon(vehicle.insuranceExpiry) ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {formatDate(vehicle.insuranceExpiry)}
                    {isExpiringSoon(vehicle.insuranceExpiry) && !isExpired(vehicle.insuranceExpiry) && (
                      <span className="ml-2 text-xs text-amber-600">(Expires in {Math.ceil((new Date(vehicle.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days)</span>
                    )}
                    {isExpired(vehicle.insuranceExpiry) && (
                      <span className="ml-2 text-xs text-red-600">(EXPIRED - Vehicle Offline)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Registration Expiry</span>
                  <span className={`font-semibold ${
                    isExpired(vehicle.registrationExpiry) ? 'text-red-600' : 
                    isExpiringSoon(vehicle.registrationExpiry) ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {formatDate(vehicle.registrationExpiry)}
                    {isExpiringSoon(vehicle.registrationExpiry) && !isExpired(vehicle.registrationExpiry) && (
                      <span className="ml-2 text-xs text-amber-600">(Expires in {Math.ceil((new Date(vehicle.registrationExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days)</span>
                    )}
                    {isExpired(vehicle.registrationExpiry) && (
                      <span className="ml-2 text-xs text-red-600">(EXPIRED - Vehicle Offline)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <select
                  value={vehicle.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updatingStatus || isExpiredVehicle}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Available">Set as Available</option>
                  <option value="On Delivery">Set as On Delivery</option>
                  <option value="Maintenance">Set as Maintenance</option>
                  <option value="Offline">Set as Offline</option>
                </select>
                {isExpiredVehicle && (
                  <p className="text-xs text-red-600 text-center">
                    ⚠️ Status changes disabled. Please renew expired documents first.
                  </p>
                )}
                
                <Link
                  to={`/vehicles/edit/${vehicle._id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Vehicle Details
                </Link>
                
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"

          
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-emerald-400 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Vehicle"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleDetails;