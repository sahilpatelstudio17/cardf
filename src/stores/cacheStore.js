import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { carsAPI, subscriptionAPI, authAPI, bookingAPI, swapAPI } from '../services/api'

export const useCacheStore = defineStore('cache', () => {
  // ===== STATIC DATA (Cars & Plans) =====
  const cars = ref([])
  const subscriptionPlans = ref([])
  const carsCached = ref(false)
  const plansCached = ref(false)
  const isLoadingCars = ref(false)
  const isLoadingPlans = ref(false)

  // ===== USER DATA (Cached per user) =====
  const currentUser = ref(null)
  const userSubscription = ref(null)
  const userBookings = ref([])
  const swapHistory = ref([])
  const userDataCached = ref(false)
  const isLoadingUserData = ref(false)
  
  const errorMessage = ref('')

  // Computed
  const hasCars = computed(() => cars.value.length > 0)
  const hasPlans = computed(() => subscriptionPlans.value.length > 0)

  // Actions - Load Cars
  const loadCars = async () => {
    // If already cached, return immediately (no API call)
    if (carsCached.value && hasCars.value) {
    //   console.log('✅ Using cached cars from Pinia store')
      return cars.value
    }

    // First time - fetch from API
    isLoadingCars.value = true
    // console.log('🔐 Fetching cars from API (first time)')

    try {
      const response = await carsAPI.getAvailableCars()
      cars.value = response.data
      carsCached.value = true
    //   console.log('💾 Cars cached in Pinia store')
      return cars.value
    } catch (error) {
      console.error('Failed to load cars:', error)
      errorMessage.value = 'Failed to load cars'
      carsCached.value = false
      return []
    } finally {
      isLoadingCars.value = false
    }
  }

  // Actions - Load Subscription Plans
  const loadPlans = async () => {
    // If already cached, return immediately (no API call)
    if (plansCached.value && hasPlans.value) {
    //   console.log('✅ Using cached subscription plans from Pinia store')
      return subscriptionPlans.value
    }

    // First time - fetch from API
    isLoadingPlans.value = true
    // console.log('🔐 Fetching subscription plans from API (first time)')

    try {
      const response = await subscriptionAPI.getPlans()
      subscriptionPlans.value = response.data

      // If no plans, add default ones
      if (subscriptionPlans.value.length === 0) {
        subscriptionPlans.value = [
          {
            id: 1,
            name: 'Basic',
            price: 9999,
            duration_months: 1,
            swap_limit: 2,
            tier: 'basic',
            max_active_bookings: 1
          },
          {
            id: 2,
            name: 'Premium',
            price: 13999,
            duration_months: 1,
            swap_limit: 5,
            tier: 'premium',
            max_active_bookings: 2
          },
          {
            id: 3,
            name: 'Luxury',
            price: 19999,
            duration_months: 1,
            swap_limit: 7,
            tier: 'luxury',
            max_active_bookings: 3
          }
        ]
      }

      plansCached.value = true
    //   console.log('💾 Subscription plans cached in Pinia store')
      return subscriptionPlans.value
    } catch (error) {
      console.error('Failed to load plans:', error)

      // Use default plans on error
      subscriptionPlans.value = [
        {
          id: 1,
          name: 'Basic',
          price: 299,
          duration_months: 1,
          swap_limit: 1,
          tier: 'basic',
          max_active_bookings: 1
        },
        {
          id: 2,
          name: 'Premium',
          price: 499,
          duration_months: 1,
          swap_limit: 2,
          tier: 'premium',
          max_active_bookings: 2
        },
        {
          id: 3,
          name: 'Luxury',
          price: 799,
          duration_months: 1,
          swap_limit: 999,
          tier: 'luxury',
          max_active_bookings: 3
        }
      ]

      plansCached.value = true
      return subscriptionPlans.value
    } finally {
      isLoadingPlans.value = false
    }
  }

  // Clear cache (for logout)
  const clearCache = () => {
    // Clear static data
    cars.value = []
    subscriptionPlans.value = []
    carsCached.value = false
    plansCached.value = false
    
    // Clear user data
    currentUser.value = null
    userSubscription.value = null
    userBookings.value = []
    swapHistory.value = []
    userDataCached.value = false
    
    errorMessage.value = ''
  }

  // Load all user data (me, subscription, bookings, swaps)
  const loadUserData = async () => {
    // If already cached, return immediately
    if (userDataCached.value && currentUser.value) {
      return {
        user: currentUser.value,
        subscription: userSubscription.value,
        bookings: userBookings.value,
        swaps: swapHistory.value
      }
    }

    isLoadingUserData.value = true

    try {
      // Load all user data in parallel
      const [userRes, subRes, bookingsRes, swapsRes] = await Promise.all([
        authAPI.getCurrentUser().catch(() => null),
        subscriptionAPI.getUserSubscription().catch(() => null),
        bookingAPI.getMyBookings().catch(() => null),
        swapAPI.getSwapHistory().catch(() => null)
      ])

      // Set user data
      currentUser.value = userRes?.data || null
      userSubscription.value = subRes?.data || null
      userBookings.value = bookingsRes?.data || []
      swapHistory.value = swapsRes?.data || []

      userDataCached.value = true

      return {
        user: currentUser.value,
        subscription: userSubscription.value,
        bookings: userBookings.value,
        swaps: swapHistory.value
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
      errorMessage.value = 'Failed to load user data'
      userDataCached.value = false
      return null
    } finally {
      isLoadingUserData.value = false
    }
  }

  // Refresh user data (clear cache and reload)
  const refreshUserData = async () => {
    userDataCached.value = false
    return loadUserData()
  }

  return {
    // State - Static Data
    cars,
    subscriptionPlans,
    carsCached,
    plansCached,
    isLoadingCars,
    isLoadingPlans,

    // State - User Data
    currentUser,
    userSubscription,
    userBookings,
    swapHistory,
    userDataCached,
    isLoadingUserData,

    // State - Errors
    errorMessage,

    // Computed
    hasCars,
    hasPlans,

    // Actions - Static Data
    loadCars,
    loadPlans,

    // Actions - User Data
    loadUserData,
    refreshUserData,

    // Actions - General
    clearCache,

    // Actions - Refresh
    refreshCars: () => {
      carsCached.value = false
      return loadCars()
    },
    refreshPlans: () => {
      plansCached.value = false
      return loadPlans()
    }
  }
})
