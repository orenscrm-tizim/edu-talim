const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

export const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
  return `${base}${url}`;
};

export const api = {
  // Auth & Users
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },
  getUsers: async (role) => {
    const query = role ? `?role=${role}` : '';
    const res = await fetch(`${API_BASE}/users${query}`);
    return res.json();
  },
  createUser: async (data) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateUser: async (id, data) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Courses
  getCourses: async () => {
    const res = await fetch(`${API_BASE}/courses`);
    return res.json();
  },
  createCourse: async (data) => {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Groups
  getGroups: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/groups${query ? `?${query}` : ''}`);
    return res.json();
  },
  getGroupById: async (id) => {
    const res = await fetch(`${API_BASE}/groups/${id}`);
    return res.json();
  },
  createGroup: async (data) => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteGroup: async (id) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Homeworks
  getHomeworks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/homeworks${query ? `?${query}` : ''}`);
    return res.json();
  },
  getHomeworkById: async (id) => {
    const res = await fetch(`${API_BASE}/homeworks/${id}`);
    return res.json();
  },
  createHomework: async (data) => {
    const res = await fetch(`${API_BASE}/homeworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteHomework: async (id) => {
    const res = await fetch(`${API_BASE}/homeworks/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Submissions
  submitHomework: async (data) => {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  gradeSubmission: async (id, data) => {
    const res = await fetch(`${API_BASE}/submissions/${id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Direct Messages (Lichka)
  getMessages: async (user1, user2) => {
    const res = await fetch(`${API_BASE}/messages?user1=${user1}&user2=${user2}`);
    return res.json();
  },
  sendMessage: async (data) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getContacts: async (userId) => {
    const res = await fetch(`${API_BASE}/messages/contacts/${userId}`);
    return res.json();
  },

  // Attendance (Davomat)
  getAttendance: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/attendance${query ? `?${query}` : ''}`);
    return res.json();
  },
  saveAttendance: async (data) => {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Materials & Videos
  getMaterials: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/materials${query ? `?${query}` : ''}`);
    return res.json();
  },
  createMaterial: async (data) => {
    const res = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteMaterial: async (id) => {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Announcements
  getAnnouncements: async () => {
    const res = await fetch(`${API_BASE}/announcements`);
    return res.json();
  },
  createAnnouncement: async (data) => {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Leaderboard
  getLeaderboard: async () => {
    const res = await fetch(`${API_BASE}/leaderboard`);
    return res.json();
  },

  // Stats
  getStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  // Upload
  uploadFile: async (formData) => {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }
};
