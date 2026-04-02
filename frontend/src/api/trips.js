const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Get all trips for logged-in transporter
export const fetchMyTrips = async (token, page = 1, limit = 10, status = '') => {
  let url = `${API_BASE_URL}/api/trips/my-trips?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch trips');
  }
  
  return response.json();
};

// Get single trip by ID
export const fetchTripById = async (token, tripId) => {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch trip details');
  }
  
  return response.json();
};

// Get available orders for transport
export const fetchAvailableOrders = async (token, page = 1, limit = 10, district = '') => {
  let url = `${API_BASE_URL}/api/trips/available-orders?page=${page}&limit=${limit}`;
  if (district) url += `&district=${district}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch available orders');
  }
  
  return response.json();
};

// Get my vehicles (for trip creation)
export const fetchMyVehicles = async (token) => {
  const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const profileData = await profileRes.json();
  const transporterId = profileData.user?._id;
  
  const response = await fetch(`${API_BASE_URL}/api/vehicles?transporterId=${transporterId}&status=Available`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicles');
  }
  
  return response.json();
};

// Create a new trip
export const createTrip = async (token, tripData) => {
  const response = await fetch(`${API_BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tripData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create trip');
  }
  
  return response.json();
};

// Update trip status
export const updateTripStatus = async (token, tripId, status, reason = '') => {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, reason })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update trip status');
  }
  
  return response.json();
};

// Change vehicle for a trip
export const changeTripVehicle = async (token, tripId, vehicleId) => {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/vehicle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ vehicleId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change vehicle');
  }
  
  return response.json();
};

// Cancel a trip
export const cancelTrip = async (token, tripId, reason = '') => {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel trip');
  }
  
  return response.json();
};

// Get trip statistics
export const fetchTripStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/trips/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch statistics');
  }
  
  return response.json();
};