import conf from '../conf/conf.js';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export class AuthService {
    constructor() {
        this.baseURL = conf.apiUrl;
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        // Request interceptor to add auth token
        axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('access_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle token refresh
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshed = await this.refreshToken();
                        if (refreshed) {
                            const token = localStorage.getItem('access_token');
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        this.logout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    async createAccount({ username, email, password, password_confirm, first_name, last_name }) {
        try {
            const response = await axios.post(`${this.baseURL}/auth/register/`, {
                username: username,
                email,
                password,
                password_confirm,
                first_name,
                last_name,
            });
    
            const { access, refresh, user } = response.data;
    
            // Store tokens
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
    
            // Auto login after registration
            return await this.login({ email, password });
        } catch (error) {
            console.log("Django auth service :: createAccount :: error", error);
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            const response = await axios.post(`${this.baseURL}/auth/login/`, {
                email,
                password,
            });

            const { access, refresh, user } = response.data;

            // Store tokens
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            return {
                ...user,
                $id: user.id,
                name: `${user.first_name} ${user.last_name}`.trim(),
                email: user.email,
            };
        } catch (error) {
            console.log("Django auth service :: login :: error", error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return null;

            // Check if token is expired
            if (this.isTokenExpired(token)) {
                const refreshed = await this.refreshToken();
                if (!refreshed) return null;
            }

            const response = await axios.get(`${this.baseURL}/auth/user/`);
            const user = response.data;

            return {
                ...user,
                $id: user.id,
                name: `${user.first_name} ${user.last_name}`.trim(),
                email: user.email,
            };
        } catch (error) {
            console.log("Django auth service :: getCurrentUser :: error", error);
            return null;
        }
    }

    async logout() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                await axios.post(`${this.baseURL}/auth/logout/`, {
                    refresh: refreshToken,
                });
            }
        } catch (error) {
            console.log("Django auth service :: logout :: error", error);
        } finally {
            // Always clear tokens regardless of API call success
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                this.logout();
                return false;
            }

            // Check if refresh token is expired
            if (this.isTokenExpired(refreshToken)) {
                this.logout();
                return false;
            }

            const response = await axios.post(`${this.baseURL}/auth/refresh/`, {
                refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem('access_token', access);

            return true;
        } catch (error) {
            console.log("Django auth service :: refreshToken :: error", error);
            this.logout();
            return false;
        }
    }

    isTokenExpired(token) {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch (error) {
            console.log("Django auth service :: isTokenExpired :: error", error);
            return true;
        }
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    isAuthenticated() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token);
    }

    // Utility method to get user info from token without API call
    getUserFromToken() {
        try {
            const token = this.getToken();
            if (!token || this.isTokenExpired(token)) return null;

            const decoded = jwtDecode(token);
            return {
                id: decoded.user_id,
                $id: decoded.user_id,
            };
        } catch (error) {
            console.log("Django auth service :: getUserFromToken :: error", error);
            return null;
        }
    }

    // Method to manually trigger token refresh
    async ensureValidToken() {
        const token = this.getToken();
        if (!token) return false;

        if (this.isTokenExpired(token)) {
            return await this.refreshToken();
        }

        return true;
    }
}

const authService = new AuthService();

export default authService;