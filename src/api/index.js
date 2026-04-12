import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Create Axios instance configured for Go API
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: true, // Send HttpOnly cookies for refresh token
})

// Request interceptor — attach access token from memory
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }

  // Hindari data GET stale dari cache browser/proxy.
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache'
    config.headers.Pragma = 'no-cache'
  }

  // Let browser set multipart boundary automatically for FormData.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// Auth endpoints that should NEVER trigger the 401 retry logic
const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout']

// Response interceptor — handle 401 with silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''

    // Skip retry for auth endpoints to prevent infinite loops
    const isAuthEndpoint = AUTH_URLS.some(url => requestUrl.includes(url))

    // If 401 on a non-auth endpoint and we haven't retried yet, attempt silent refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const { data } = await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
        })

        const auth = useAuthStore()

        // Store new access token in memory
        auth.setAccessToken(data.access_token)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — clear state silently (don't call logout API)
        const auth = useAuthStore()
        auth.accessToken = null
        auth.user = null
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
