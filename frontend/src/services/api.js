const API_BASE = '/api';

let token = localStorage.getItem('ss_token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('ss_token', t);
  else localStorage.removeItem('ss_token');
}

export function getToken() {
  if (!token) token = localStorage.getItem('ss_token');
  return token;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const auth = {
  signup: (d) => request('/auth/signup', { method: 'POST', body: JSON.stringify(d) }),
  login: (d) => request('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
  me: () => request('/auth/me'),
};

export const skills = {
  list: () => request('/skills'),
};

export const users = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
};

export const profile = {
  get: () => request('/profile'),
  update: (d) => request('/profile', { method: 'PUT', body: JSON.stringify(d) }),
  uploadPicture: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/profile/picture', {
      method: 'POST',
      body: fd,
      headers: {},
    });
  },
};

export const matches = {
  list: () => request('/matches'),
  recommendations: () => request('/matches/recommendations'),
  intro: (id) => request(`/matches/${id}/intro`, { method: 'POST' }),
};

export const connections = {
  list: () => request('/connections'),
  send: (id) => request('/connections', { method: 'POST', body: JSON.stringify({ user_id: id }) }),
  respond: (id, action) => request(`/connections/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
};

export const follows = {
  list: () => request('/follows'),
  follow: (id) => request('/follows', { method: 'POST', body: JSON.stringify({ user_id: id }) }),
  unfollow: (id) => request(`/follows/${id}`, { method: 'DELETE' }),
};

export const chat = {
  conversations: () => request('/chat/conversations'),
  messages: (id) => request(`/chat/conversations/${id}/messages`),
  send: (id, content) => request(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  start: (id) => request(`/chat/start/${id}`, { method: 'POST' }),
};

export const sessions = {
  list: () => request('/sessions'),
  create: (d) => request('/sessions', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
};

export const notifications = {
  list: () => request('/notifications'),
  read: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
};

export const dashboard = {
  get: () => request('/dashboard'),
};

export const assistant = {
  ask: (message) => request('/ai/assistant', { method: 'POST', body: JSON.stringify({ message }) }),
};

// Service aliases for convenience
export const authService = auth;
export const skillsService = skills;
export const usersService = users;
export const profileService = profile;
export const matchesService = matches;
export const connectionsService = connections;
export const followsService = follows;
export const chatService = chat;
export const sessionsService = sessions;
export const notificationsService = notifications;
export const dashboardService = dashboard;
export const assistantService = assistant;
