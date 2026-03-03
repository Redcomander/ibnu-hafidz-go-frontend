import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // State — access token in memory only (XSS-safe)
  const accessToken = ref(null)
  const user = ref(null)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')
  const userRoles = computed(() => user.value?.roles || [])
  const userPermissions = computed(() => {
    const perms = new Set()
    userRoles.value.forEach(role => {
      role.permissions?.forEach(p => perms.add(p.name))
    })
    return perms
  })

  // Check if user has a specific permission
  function hasPermission(permission) {
    return userPermissions.value.has(permission)
  }

  // Check if user has any of the listed permissions
  function hasAnyPermission(permissions) {
    return permissions.some(p => userPermissions.value.has(p))
  }

  // Set access token (called after login or refresh)
  function setAccessToken(token) {
    accessToken.value = token
  }

  // Login
  async function login(username, password) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/login', { username, password })
      accessToken.value = data.access_token
      user.value = data.user
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // Logout
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors — clear state anyway
    }
    accessToken.value = null
    user.value = null
    router.push({ name: 'login' })
  }

  // Fetch current user profile
  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data
      return true
    } catch {
      return false
    }
  }

  // Try silent refresh on app load (uses raw axios to bypass interceptor)
  async function tryRefresh() {
    try {
      const axios = (await import('axios')).default
      const { data } = await axios.post('/api/auth/refresh', null, {
        withCredentials: true,
      })
      accessToken.value = data.access_token
      user.value = data.user
      return true
    } catch {
      return false
    }
  }

  return {
    accessToken,
    user,
    loading,
    isAuthenticated,
    userName,
    userEmail,
    userRoles,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    setAccessToken,
    login,
    logout,
    fetchUser,
    tryRefresh,
  }
})
