import { ref, computed } from 'vue'
import { authAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'

// Global user state - fetch from Pinia cache, not backend
const currentUser = ref(null)
const isLoadingUser = ref(false)
const userError = ref(null)
let userFetchPromise = null

/**
 * Composable for managing user data from Pinia cache
 * Uses cached user data from App.vue instead of making duplicate API calls
 * 
 * Features:
 * - User data comes from Pinia cache (loaded once in App.vue)
 * - No duplicate /me API calls from multiple components
 * - Reactive user state managed in Vue
 * - Returns user data, auth status, and admin flag
 */
export function useUser() {
  const cacheStore = useCacheStore()

  /**
   * Fetch current user from Pinia cache (not from API)
   */
  const fetchCurrentUser = async () => {
    // Check if token exists
    const token = localStorage.getItem('access_token')
    if (!token) {
      currentUser.value = null
      return null
    }

    isLoadingUser.value = true
    userError.value = null
    
    // Get user from Pinia cache instead of making API call
    const cachedUser = cacheStore.currentUser
    if (cachedUser) {
      currentUser.value = cachedUser
      isLoadingUser.value = false
      return cachedUser
    }

    // If not in cache, try to fetch (shouldn't happen if App.vue initialized properly)
    userFetchPromise = (async () => {
      try {
        const response = await authAPI.getCurrentUser()
        currentUser.value = response.data
        return response.data
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        currentUser.value = null
        userError.value = error.message
        
        // If 401, token is invalid - clear it
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          currentUser.value = null
        }
        throw error
      } finally {
        isLoadingUser.value = false
        userFetchPromise = null
      }
    })()

    return userFetchPromise
  }

  /**
   * Check if user is authenticated (has token + user data loaded)
   */
  const isAuthenticated = computed(() => {
    const hasToken = !!localStorage.getItem('access_token')
    const hasUser = currentUser.value !== null
    return hasToken && hasUser
  })

  /**
   * Get user's full name
   */
  const userName = computed(() => {
    if (!currentUser.value) return ''
    return currentUser.value.full_name || currentUser.value.email?.split('@')[0] || 'User'
  })

  /**
   * Get user's email
   */
  const userEmail = computed(() => {
    return currentUser.value?.email || ''
  })

  /**
   * Get user's phone
   */
  const userPhone = computed(() => {
    return currentUser.value?.phone || ''
  })

  /**
   * Check if current user is admin
   */
  const isAdmin = computed(() => currentUser.value?.is_admin === true)

  /**
   * Get user object
   */
  const getUser = () => currentUser.value

  /**
   * Clear user data (on logout)
   */
  const clearUser = () => {
    currentUser.value = null
    userError.value = null
    localStorage.removeItem('access_token')
    // Also clear Pinia cache on logout
    cacheStore.clearCache()
  }

  /**
   * Refresh user data from backend
   */
  const refreshUser = async () => {
    currentUser.value = null
    return fetchCurrentUser()
  }

  return {
    // State
    currentUser,
    isLoadingUser,
    userError,
    
    // Methods
    fetchCurrentUser,
    refreshUser,
    clearUser,
    getUser,
    
    // Computed
    isAuthenticated,
    userName,
    userEmail,
    userPhone,
    isAdmin
  }
}
