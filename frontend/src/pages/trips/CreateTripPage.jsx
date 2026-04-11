import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';
import { fetchMyVehicles, createTrip } from '../../api/trips';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateTripPage = () => {
  const { orderId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  // Refs for map
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const routingControlRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  
  // Form state
  const [tripForm, setTripForm] = useState({
    vehicleId: '',
    scheduledPickup: '',
    estimatedDelivery: '',
    baseFare: '',
    distanceCharge: '0'
  });

  // Fetch order details and locations
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters can create trips',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchOrderAndLocations();
    fetchVehicles();
  }, [token, user, orderId]);

  const fetchOrderAndLocations = async () => {
    try {
      // Fetch order details
      const orderRes = await fetch(`${API_BASE_URL}/api/trips/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      const orderDetails = orderData.order;
      setOrder(orderDetails);
      
      // Get pickup location (from product's farmer)
      const pickup = {
        lat: orderDetails.product?.pickupLocation?.coordinates?.lat,
        lng: orderDetails.product?.pickupLocation?.coordinates?.lng,
        address: orderDetails.product?.pickupLocation?.address,
        name: `${orderDetails.product?.farmer?.fullName}'s Farm`
      };
      
      // Get dropoff location (from order delivery address)
      const dropoff = {
        lat: orderDetails.deliveryAddress?.coordinates?.lat,
        lng: orderDetails.deliveryAddress?.coordinates?.lng,
        address: orderDetails.deliveryAddress?.addressLine,
        name: orderDetails.distributor?.fullName
      };
      
      setPickupLocation(pickup);
      setDropoffLocation(dropoff);
      
      // Set default dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
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
        text: 'Failed to load order details',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await fetchMyVehicles(token);
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

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
    
    // Add routing control to show the route [citation:7]
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
        
        // Auto-calculate base fare based on distance
        const estimatedFare = Math.round(distanceKm * 150); // LKR 150 per km
        setTripForm(prev => ({
          ...prev,
          baseFare: estimatedFare.toString()
        }));
      }
    });
    
    // Fit map to show the whole route
    setTimeout(() => {
      const bounds = L.latLngBounds([
        [pickupLocation.lat, pickupLocation.lng],
        [dropoffLocation.lat, dropoffLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }, 500);
    
    setLoading(false);
  };

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (routingControlRef.current) {
        routingControlRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleSendRequest = async () => {
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
        text: 'Please enter a valid proposed fare',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Send Delivery Request',
      html: `
        <div style="text-align: left;">
          <p><strong>Order:</strong> ${order?.product?.productName}</p>
          <p><strong>Vehicle:</strong> ${vehicles.find(v => v._id === tripForm.vehicleId)?.brand} ${vehicles.find(v => v._id === tripForm.vehicleId)?.model}</p>
          <p><strong>Distance:</strong> ${distance} km</p>
          <p><strong>Est. Travel Time:</strong> ${duration}</p>
          <p><strong>Proposed Fare:</strong> LKR ${(parseFloat(tripForm.baseFare) + parseFloat(tripForm.distanceCharge || 0)).toLocaleString()}</p>
          <p style="margin-top: 10px; color: #666; font-size: 12px;">⏳ Waiting for distributor approval...</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Send Request',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    setCreating(true);
    try {
      const payload = {
        orderId,
        vehicleId: tripForm.vehicleId,
        proposedFare: parseFloat(tripForm.baseFare),
        scheduledPickup: tripForm.scheduledPickup,
        estimatedDelivery: tripForm.estimatedDelivery
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
        throw new Error(error.message || 'Failed to send request');
      }

      const data = await res.json();

      Swal.fire({
        icon: 'success',
        title: 'Request Sent!',
        text: 'Delivery request has been sent to the distributor. Please wait for their approval.',
        confirmButtonColor: '#10b981',
        timer: 3000
      });

      navigate('/trips');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send delivery request',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setCreating(false);
    }
  };

  if (!pickupLocation || !dropoffLocation) {
    return (
      <>
        <ProfileNav active="available" links={[
          { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
          { key: 'trips', label: 'My Trips', to: '/trips' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-6xl text-center py-12">
            <div className="text-slate-500">Loading locations...</div>
          </div>
        </div>
      </>
    );
  }

  const selectedVehicle = vehicles.find(v => v._id === tripForm.vehicleId);
  const totalFare = (parseFloat(tripForm.baseFare || 0) + parseFloat(tripForm.distanceCharge || 0));

  return (
    <>
      <ProfileNav active="available" links={[
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' }
      ]} />

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Create New Trip</h1>
                <p className="text-slate-600">Review route and enter trip details</p>
              </div>
              <button
                onClick={() => navigate('/available-orders')}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                ← Back to Orders
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Map + Form Side by Side */}
        <div className="mx-auto max-w-7xl p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Map Section - Takes 60% on large screens */}
            <div className="lg:w-3/5">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Route Map</h2>
                  <p className="text-sm text-slate-500">Pickup → Delivery route in Sri Lanka</p>
                </div>
                <div 
                  ref={mapContainerRef} 
                  style={{ height: '500px', width: '100%' }}
                  className="leaflet-container"
                />
                {loading && (
                  <div className="p-4 text-center text-slate-500">
                    Loading map and calculating route...
                  </div>
                )}
              </div>
            </div>

            {/* Form Section - Takes 40% on large screens */}
            <div className="lg:w-2/5">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Trip Details</h2>
                
                {/* Order Summary */}
                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Order Summary</p>
                  <p className="font-semibold text-slate-900">{order?.product?.productName}</p>
                  <p className="text-sm text-slate-600">Quantity: {order?.quantity} {order?.product?.unit}</p>
                  <p className="text-sm text-slate-600">Order Value: LKR {order?.totalPrice?.toLocaleString()}</p>
                  {order?.product?.pickupLocation?.instructions && (
                    <div className="mt-3 rounded-lg bg-blue-100 p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">📋 Pickup Instructions</p>
                      <p className="text-sm text-blue-800">{order.product.pickupLocation.instructions}</p>
                    </div>
                  )}
                </div>
                
                {/* Route Info */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-600 uppercase font-semibold">Distance</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {distance ? `${distance} km` : 'Calculating...'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-blue-600 uppercase font-semibold">Est. Travel Time</p>
                    <p className="text-xl font-bold text-blue-700">
                      {duration || 'Calculating...'}
                    </p>
                  </div>
                </div>
                
                {/* Location Info */}
                <div className="mb-6 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-emerald-600 text-sm font-bold">P</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Pickup Location (Farmer)</p>
                      <p className="text-sm font-semibold text-slate-900">{pickupLocation.name}</p>
                      <p className="text-xs text-slate-500">{pickupLocation.address}</p>
                      {order?.product?.farmer?.phone && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">📞 {order.product.farmer.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-600 text-sm font-bold">D</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Delivery Location (Distributor)</p>
                      <p className="text-sm font-semibold text-slate-900">{dropoffLocation.name}</p>
                      <p className="text-xs text-slate-500">{dropoffLocation.address}</p>
                      {order?.distributor?.phone && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">📞 {order.distributor.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Select Vehicle *</label>
                    <select
                      value={tripForm.vehicleId}
                      onChange={(e) => setTripForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                      className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.brand} {v.model} - {v.registrationNumber} ({v.loadCapacity?.weight?.value || 0}kg)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Pickup Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={tripForm.scheduledPickup}
                        onChange={(e) => setTripForm(prev => ({ ...prev, scheduledPickup: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Delivery Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={tripForm.estimatedDelivery}
                        onChange={(e) => setTripForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                        min={tripForm.scheduledPickup}
                        className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Base Fare (LKR) *</label>
                      <input
                        type="number"
                        placeholder="Base fare"
                        value={tripForm.baseFare}
                        onChange={(e) => setTripForm(prev => ({ ...prev, baseFare: e.target.value }))}
                        className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">Suggested: ~LKR 150/km</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Extra Charges</label>
                      <input
                        type="number"
                        placeholder="Additional fees"
                        value={tripForm.distanceCharge}
                        onChange={(e) => setTripForm(prev => ({ ...prev, distanceCharge: e.target.value }))}
                        className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Fare Summary */}
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Base Fare:</span>
                      <span className="font-semibold">LKR {parseFloat(tripForm.baseFare || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Extra Charges:</span>
                      <span className="font-semibold">LKR {parseFloat(tripForm.distanceCharge || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-emerald-200">
                      <span>Total Fare:</span>
                      <span className="text-emerald-700">LKR {totalFare.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSendRequest}
                      disabled={creating || !tripForm.vehicleId || !distance}
                      className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Sending Request...' : 'Send Request'}
                    </button>
                    <button
                      onClick={() => navigate('/available-orders')}
                      className="flex-1 rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {!vehicles.length && (
                    <p className="text-center text-sm text-amber-600 mt-2">
                      ⚠️ No vehicles available. Please add a vehicle first.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateTripPage;