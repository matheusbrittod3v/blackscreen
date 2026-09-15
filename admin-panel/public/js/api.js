/**
 * ApiService Class - Centralized HTTP Client & Security Interceptor
 */
class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            let data = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                // Security Interceptor: Handle 401 Unauthorized or 403 Forbidden
                if ((response.status === 401 || response.status === 403) && this.token) {
                    if (data.error !== 'Conta desativada' && !endpoint.includes('/login')) {
                        this.setToken(null);
                        if (typeof Auth !== 'undefined') Auth.currentUser = null;
                        if (typeof App !== 'undefined' && typeof App.showLanding === 'function') {
                            App.showLanding();
                            Utils.showToast('Sessão expirada. Por favor, faça login novamente.', 'warning');
                        }
                    }
                }
                const err = new Error(data.error || data.message || 'Erro na requisição');
                err.data = data;
                err.status = response.status;
                throw err;
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async upload(endpoint, formData) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            const err = new Error(data.error || 'Erro no envio do arquivo');
            err.data = data;
            err.status = response.status;
            throw err;
        }

        return data;
    }
}

// Global API instance
const API = new ApiService();
