const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  getToken: () => localStorage.getItem('token'),

  setToken: (token) => localStorage.setItem('token', token),

  logout: () => localStorage.removeItem('token'),

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  },

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.access_token) this.setToken(data.access_token);
    return data;
  },

  async register(username, password) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getCurrentUser() {
    return await this.request('/auth/me');
  },

  async updateProfile(profileData) {
    return await this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  async getProfileData() {
    return await this.request('/profile/me');
  },

  async getPublicProfile(userId) {
    return await this.request(`/profile/view/${userId}`);
  },

  async getRecommendations() {
    return await this.request('/compatibility/recommendations');
  },

  async getConnectionStatus(userId) {
    return await this.request(`/compatibility/connections/status/${userId}`);
  },

  async sendConnectionRequest(userId) {
    return await this.request(`/compatibility/connections/request/${userId}`, {
      method: 'POST',
    });
  },

  async acceptConnectionRequest(userId) {
    return await this.request(`/compatibility/connections/accept/${userId}`, {
      method: 'POST',
    });
  },

  async declineConnectionRequest(userId) {
    return await this.request(`/compatibility/connections/decline/${userId}`, {
      method: 'POST',
    });
  },

  async removeConnection(userId) {
    return await this.request(`/compatibility/connections/remove/${userId}`, {
      method: 'POST',
    });
  },

  async getConnections() {
    return await this.request('/compatibility/connections');
  },
};