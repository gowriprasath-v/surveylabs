import axios from 'axios';
import toast from 'react-hot-toast';

const TOKEN_KEY = 'surveylabs_token';
const REFRESH_TOKEN_KEY = 'surveylabs_refresh_token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

// Request interceptor — attach JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Auto-refresh logic on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (refreshToken && !originalRequest.url.includes('/auth/refresh')) {
        try {
          // Send request with fetch or another axios instance to avoid infinite loop
          const res = await axios.post(`${client.defaults.baseURL}/auth/refresh`, { refreshToken });
          if (res.data?.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            
            // Replay original request, but update token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      // If no refresh token or refresh itself failed initially
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }

    if (error.response?.status >= 500) {
      toast.error('A server error occurred. Please try again later.');
    }
    
    // Propagate an ApiError-like message instead of raw axios error
    return Promise.reject(
      error.response?.data?.error || error.message || 'Request failed'
    );
  }
);

export default client;
export { TOKEN_KEY, REFRESH_TOKEN_KEY };
