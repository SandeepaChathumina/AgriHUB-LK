const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const parseResponse = async (res) => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const createOrder = async (token, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
};

export const fetchMyOrders = async (token, page = 1, limit = 10) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/orders/my-orders?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const updateMyOrder = async (token, orderId, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
};

export const cancelMyOrder = async (token, orderId) => {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const retryPayment = async (token, orderId) => {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/retry-payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const fetchFarmerOrders = async (token, page = 1, limit = 10) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/orders/farmer-orders?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const acceptFarmerOrder = async (token, orderId) => {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/farmer-accept`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const rejectFarmerOrder = async (token, orderId) => {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/farmer-reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};