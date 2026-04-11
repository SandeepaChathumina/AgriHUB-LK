const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const parseResponse = async (res) => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const fetchChatUsers = async (token) => {
  const res = await fetch(`${API_BASE_URL}/api/messages/users/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const fetchConversationList = async (token) => {
  const res = await fetch(`${API_BASE_URL}/api/messages/conversations/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const fetchConversation = async (token, userId) => {
  const res = await fetch(`${API_BASE_URL}/api/messages/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res);
};

export const sendChatMessage = async (token, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
};
