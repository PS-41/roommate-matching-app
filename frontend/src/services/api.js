const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
    // Helper to get the token from local storage
    getToken: () => localStorage.getItem('token'),

    // Helper to set the token after login/register
    setToken: (token) => localStorage.setItem('token', token),

    // Helper to clear token on logout
    logout: () => localStorage.removeItem('token'),

    // Core fetch wrapper
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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

    // Specific API Calls
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (data.access_token) this.setToken(data.access_token);
        return data;
    },

    async register(username, password) {
        // According to our backend, register doesn't return a token automatically,
        // so we will just return the data and let the component handle routing to login
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    async getCurrentUser() {
        return await this.request('/auth/me');
    }
};