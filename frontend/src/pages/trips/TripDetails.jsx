import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';
import {
  fetchTripById,
  updateTripStatus,
  changeTripVehicle,
  cancelTrip,
  fetchMyVehicles,
  updateVehicleStatus
} from '../../api/trips';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { getRoutingControlBase } from '../../lib/leafletRouting';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TripDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  // Refs for map
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const routingControlRef = useRef(null);
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showChangeVehicle, setShowChangeVehicle] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can view trip details',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    loadTripDetails();
  }, [token, user, id]);

  // Initialize map after locations are loaded
  useEffect(() => {
    if (pickupLocation && dropoffLocation && mapContainerRef.current && !mapRef.current) {
      initMap();
    }
  }, [pickupLocation, dropoffLocation]);

  const initMap = () => {
    // Create map centered between pickup and dropoff
    const centerLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
    const centerLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
    
    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 9);
    mapRef.current = map;
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add custom markers
    const pickupIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #10b981;"></div>',
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });
    
    const dropoffIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #ef4444;"></div>',
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });
    
    // Add pickup marker
    L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>Pickup Location</b><br/>${pickupLocation.address}<br/><i>${pickupLocation.name}</i>`)
      .openPopup();
    
    // Add dropoff marker
    L.marker([dropoffLocation.lat, dropoffLocation.lng], { icon: dropoffIcon })
      .addTo(map)
      .bindPopup(`<b>Delivery Location</b><br/>${dropoffLocation.address}<br/><i>${dropoffLocation.name}</i>`);
    
    // Add routing control to show the route
    routingControlRef.current = L.Routing.control({
      ...getRoutingControlBase(),
      waypoints: [
        L.latLng(pickupLocation.lat, pickupLocation.lng),
        L.latLng(dropoffLocation.lat, dropoffLocation.lng),
      ],
    }).addTo(map);
    
    // Listen for route calculation to get distance and duration
    routingControlRef.current.on('routesfound', (e) => {
      const route = e.routes[0];
      if (route) {
        // Distance in meters, convert to km
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
        // Duration in seconds, convert to hours/minutes
        const durationMin = Math.round(route.summary.totalTime / 60);
        const durationHours = Math.floor(durationMin / 60);
        const durationRemainingMin = durationMin % 60;
        
        setDistance(distanceKm);
        setDuration(durationHours > 0 
          ? `${durationHours}h ${durationRemainingMin}min` 
          : `${durationMin} min`);
      }
    });
  };

  const loadTripDetails = async () => {
    setLoading(true);
    try {
      const data = await fetchTripById(token, id);
      const tripData = data.trip;
      setTrip(tripData);
      
      // Extract pickup and dropoff locations for map
      const pickup = {
        lat: tripData.pickupLocation?.coordinates?.lat,
        lng: tripData.pickupLocation?.coordinates?.lng,
        address: tripData.pickupLocation?.address,
        name: tripData.order?.product?.farmer?.fullName ? `${tripData.order.product.farmer.fullName}'s Farm` : 'Pickup Location'
      };
      
      const dropoff = {
        lat: tripData.dropoffLocation?.coordinates?.lat,
        lng: tripData.dropoffLocation?.coordinates?.lng,
        address: tripData.dropoffLocation?.address,
        name: tripData.order?.distributor?.fullName || 'Delivery Location'
      };
      
      setPickupLocation(pickup);
      setDropoffLocation(dropoff);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVehicles = async () => {
    try {
      const data = await fetchMyVehicles(token);
      setAvailableVehicles(data.vehicles || []);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load vehicles',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleChangeVehicle = async () => {
    if (!selectedVehicle) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Vehicle',
        text: 'Please select a vehicle',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Change Vehicle',
      text: 'Are you sure you want to change the vehicle for this trip?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Change',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await changeTripVehicle(token, id, selectedVehicle);
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Vehicle changed successfully',
        confirmButtonColor: '#10b981',
        timer: 2000
      });
      setShowChangeVehicle(false);
      loadTripDetails();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    const statusMessages = {
      Accepted: 'accept',
      'In Progress': 'start',
      Completed: 'complete',
      Cancelled: 'cancel'
    };

    // Map display status to API status
    const statusMap = {
      'Accepted': 'Confirmed',
      'In Progress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };

    const apiStatus = statusMap[newStatus] || newStatus;

    let reason = '';
    if (newStatus === 'Cancelled') {
      const { value } = await Swal.fire({
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
      if (value === undefined) return;
      reason = value;
    } else {
      const result = await Swal.fire({
        title: `Confirm ${newStatus}`,
        text: `Are you sure you want to ${statusMessages[newStatus]} this trip?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: `Yes, ${newStatus}`,
        cancelButtonText: 'Cancel'
      });
      if (!result.isConfirmed) return;
    }

    setUpdating(true);
    try {
      if (newStatus === 'Cancelled') {
        await cancelTrip(token, id, reason);
      } else {
        await updateTripStatus(token, id, apiStatus, reason);
      }

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
        text: `Trip ${newStatus.toLowerCase()} successfully`,
        confirmButtonColor: '#10b981',
        timer: 2000
      });
      loadTripDetails();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Accepted': return 'bg-blue-100 text-blue-700';
      case 'Confirmed': return 'bg-sky-100 text-sky-800';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const canChangeVehicle = trip?.tripStatus === 'Pending' || trip?.tripStatus === 'Accepted';
  const canAccept = trip?.tripStatus === 'Pending';
  const canStart =
    trip?.tripStatus === 'Accepted' || trip?.tripStatus === 'Confirmed';
  const canComplete = trip?.tripStatus === 'In Progress';
  const canCancel = trip?.tripStatus === 'Pending' || trip?.tripStatus === 'Accepted';

  if (loading) {
    return (
      <>
        <ProfileNav active="trips" links={[
          { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
          { key: 'trips', label: 'My Trips', to: '/trips' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex justify-center py-12">Loading trip details...</div>
          </div>
        </div>
      </>
    );
  }

  if (!trip) return null;

  return (
    <>
      <ProfileNav active="trips" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' }
      ]} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/trips')}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Trips
          </button>

          {/* Trip Header */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className={`bg-gradient-to-r ${
              trip.tripStatus === 'Completed' ? 'from-green-600 to-green-800' :
              trip.tripStatus === 'Cancelled' ? 'from-red-600 to-red-800' :
              'from-emerald-600 to-emerald-800'
            } px-6 py-8 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-80">Trip ID</p>
                  <h1 className="text-2xl font-bold">{trip.tripId || trip._id}</h1>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(trip.tripStatus)} bg-opacity-90`}>
                  {trip.tripStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Order Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product</span>
                  <span className="font-semibold text-slate-900">{trip.order?.product?.productName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-900">{trip.order?.quantity || 0} {trip.order?.product?.unit || 'kg'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Value</span>
                  <span className="font-semibold text-slate-900">LKR {trip.order?.totalPrice?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distributor</span>
                  <span className="font-semibold text-slate-900">{trip.order?.distributor?.fullName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact</span>
                  <span className="font-semibold text-slate-900">{trip.order?.distributor?.phone || 'N/A'}</span>
                </div>
                {trip.order?.product?.pickupLocation?.instructions && (
                  <div className="rounded-lg bg-blue-50 p-3 mt-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">📋 Pickup Instructions</p>
                    <p className="text-slate-700">{trip.order.product.pickupLocation.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Vehicle Details</h2>
                {canChangeVehicle && (
                  <button
                    onClick={() => {
                      loadAvailableVehicles();
                      setShowChangeVehicle(true);
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Change Vehicle
                  </button>
                )}
              </div>
              
              {showChangeVehicle ? (
                <div className="space-y-4">
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select a vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.brand} {v.model} - {v.registrationNumber} ({v.loadCapacity?.weight?.value || 0}kg)
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangeVehicle}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
                    >
                      Confirm Change
                    </button>
                    <button
                      onClick={() => setShowChangeVehicle(false)}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-semibold text-slate-900">
                      {trip.vehicle?.brand} {trip.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration</span>
                    <span className="font-semibold text-slate-900">{trip.vehicle?.registrationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity</span>
                    <span className="font-semibold text-slate-900">{trip.vehicle?.loadCapacity?.weight?.value || 0} kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Schedule</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Pickup</span>
                  <span className="font-semibold text-slate-900">{formatDate(trip.schedule?.scheduledPickup)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery</span>
                  <span className="font-semibold text-slate-900">{formatDate(trip.schedule?.estimatedDelivery)}</span>
                </div>
                {trip.schedule?.actualPickup && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Pickup</span>
                    <span className="font-semibold text-green-600">{formatDate(trip.schedule.actualPickup)}</span>
                  </div>
                )}
                {trip.schedule?.actualDelivery && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Delivery</span>
                    <span className="font-semibold text-green-600">{formatDate(trip.schedule.actualDelivery)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Cost Breakdown</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Fare</span>
                  <span className="font-semibold text-slate-900">LKR {trip.costs?.baseFare?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distance Charge</span>
                  <span className="font-semibold text-slate-900">LKR {trip.costs?.distanceCharge?.toLocaleString() || 0}</span>
                </div>
                {trip.costs?.additionalCharges?.map((charge, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-500">{charge.description}</span>
                    <span className="font-semibold text-slate-900">LKR {charge.amount?.toLocaleString() || 0}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total Cost</span>
                  <span className="font-bold text-emerald-600">LKR {trip.costs?.totalCost?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Map and Route Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:col-span-2">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Route Map & Details</h2>
              
              {/* Map Container */}
              <div className="mb-4 h-80 w-full overflow-hidden rounded-xl border border-slate-200">
                <div ref={mapContainerRef} className="h-full w-full"></div>
              </div>
              
              {/* Route Information */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">📍 Pickup Location</p>
                  <p className="text-slate-700 text-sm">{trip.pickupLocation?.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{trip.pickupLocation?.city}, {trip.pickupLocation?.district}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">🏁 Dropoff Location</p>
                  <p className="text-slate-700 text-sm">{trip.dropoffLocation?.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{trip.dropoffLocation?.city}</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-sm font-semibold text-purple-800 mb-2">📊 Route Info</p>
                  {distance && duration ? (
                    <div className="text-sm">
                      <p className="text-slate-700">Distance: <span className="font-semibold">{distance} km</span></p>
                      <p className="text-slate-700">Duration: <span className="font-semibold">{duration}</span></p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Calculating route...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {trip.timeline && trip.timeline.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:col-span-2">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Activity Timeline</h2>
                <div className="space-y-3">
                  {trip.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{event.status}</p>
                        <p className="text-sm text-slate-500">{formatDate(event.timestamp)}</p>
                        {event.note && <p className="text-sm text-slate-600">{event.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 md:col-span-2">
              {canAccept && (
                <button
                  onClick={() => handleStatusUpdate('Accepted')}
                  disabled={updating}
                  className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  Accept Trip
                </button>
              )}
              {canStart && (
                <button
                  onClick={() => handleStatusUpdate('In Progress')}
                  disabled={updating}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Start Trip (Mark as In Progress)
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => handleStatusUpdate('Completed')}
                  disabled={updating}
                  className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  Complete Delivery
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleStatusUpdate('Cancelled')}
                  disabled={updating}
                  className="flex-1 rounded-xl border border-red-200 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel Trip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TripDetails;