import axios from 'axios';

const TOKEN_KEY = 'surveylabs_token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    // Propagate a readable error string
    return Promise.reject(
      error.response?.data?.error || error.message || 'Request failed'
    );
  }
);

export default client;
export { TOKEN_KEY };
