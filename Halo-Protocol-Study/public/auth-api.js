// Frontend API Client for Halo Authentication
const API_BASE_URL = window.location.origin;

class HaloAuthAPI {
    constructor() {
        this.token = localStorage.getItem('halo_token');
    }

    // Helper to make API calls
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    // Auth endpoints
    async signup(userData) {
        const response = await this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
            skipAuth: true,
        });
        // Don't store token on signup - user must verify email and login
        // Token will be stored on login after email verification
        return response;
    }

    async login(credentials) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuth: true,
        });

        if (response.session?.token) {
            this.setToken(response.session.token);
        }

        return response;
    }

    async verifyEmail(userId, token) {
        return this.request('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, token }),
            skipAuth: true,
        });
    }

    async verifyMobile(userId, otp) {
        return this.request('/api/auth/verify-mobile', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, otp }),
            skipAuth: true,
        });
    }

    async resendOTP(userId) {
        return this.request('/api/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
            skipAuth: true,
        });
    }

    async logout() {
        await this.request('/api/auth/logout', {
            method: 'POST',
        });
        this.clearToken();
    }

    async googleSignIn(idToken) {
        const response = await this.request('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ id_token: idToken }),
            skipAuth: true,
        });

        if (response.session?.token) {
            this.setToken(response.session.token);
        }

        return response;
    }

    async getCurrentUser() {
        return this.request('/api/auth/me');
    }

    // Profile endpoints
    async getProfile() {
        return this.request('/api/users/profile');
    }

    async updateProfile(updates) {
        return this.request('/api/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    // Payment method endpoints
    async addPaymentMethod(cardData) {
        return this.request('/api/payment-methods', {
            method: 'POST',
            body: JSON.stringify(cardData),
        });
    }

    async getPaymentMethods() {
        return this.request('/api/payment-methods');
    }

    async getPaymentMethod(id) {
        return this.request(`/api/payment-methods/${id}`);
    }

    async verifyPaymentMethod(id, otp) {
        return this.request(`/api/payment-methods/${id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ otp }),
        });
    }

    async resendPaymentMethodOTP(id) {
        return this.request(`/api/payment-methods/${id}/resend-otp`, {
            method: 'POST',
        });
    }

    async setDefaultPaymentMethod(id) {
        return this.request(`/api/payment-methods/${id}/set-default`, {
            method: 'PATCH',
        });
    }

    async removePaymentMethod(id) {
        return this.request(`/api/payment-methods/${id}`, {
            method: 'DELETE',
        });
    }

    // Token management
    setToken(token) {
        this.token = token;
        localStorage.setItem('halo_token', token);
    }

    getToken() {
        return this.token;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('halo_token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Crypto wallet endpoints
    async addCryptoWallet(walletData) {
        return this.request('/api/crypto-wallets', {
            method: 'POST',
            body: JSON.stringify(walletData),
        });
    }

    async getCryptoWallets() {
        return this.request('/api/crypto-wallets');
    }

    async setDefaultCryptoWallet(walletId) {
        return this.request(`/api/crypto-wallets/${walletId}/set-default`, {
            method: 'PATCH',
        });
    }

    async removeCryptoWallet(walletId) {
        return this.request(`/api/crypto-wallets/${walletId}`, {
            method: 'DELETE',
        });
    }
}

// Create global instance
const haloAPI = new HaloAuthAPI();
