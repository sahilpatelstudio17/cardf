import axios from 'axios'

// base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
const N8N_CONTACT_WEBHOOK_URL = 'https://carswap.app.n8n.cloud/webhook/9edcc909-6588-422d-8a74-5325973b9210'

// axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('access_token')
      
      // Clear user data from composable state
      // We use dynamic import to avoid circular dependency
      import('../composables/useUser').then(({ useUser }) => {
        const { clearUser } = useUser()
        clearUser()
      })
      
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// auth endpoints
export const authAPI = {
  signup: async (email, password, fullName) => {
    try {
      return await apiClient.post('/signup', {
        email,
        password,
        full_name: fullName
      })
    } catch (error) {
      if (error.response?.status === 404) {
        const backendMismatch = new Error(
          'Signup endpoint not found. Start CarSwap backend and point VITE_API_BASE_URL to that server.'
        )
        backendMismatch.isBackendMismatch = true
        throw backendMismatch
      }
      throw error
    }
  },

  login: (email, password) =>
    apiClient.post('/login', new URLSearchParams({
      username: email,
      password
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),

  getCurrentUser: () => apiClient.get('/me')
}

// cars endpoints
export const carsAPI = {
  getAvailableCars: () => apiClient.get('/cars'),
  getAllCars: () => apiClient.get('/cars/all'),
  getCar: (carId) => apiClient.get(`/cars/${carId}`)
}

// subscription endpoints
export const subscriptionAPI = {
  getPlans: () => apiClient.get('/subscription-plans'),
  subscribe: (planId, carId, driverServiceDetails = null) => {
    const hasDriverService = !!driverServiceDetails
    return apiClient.post('/subscribe', {
      plan_id: planId,
      car_id: carId,
      needs_driver: hasDriverService,
      driver_service_details: driverServiceDetails
    })
  },
  getUserSubscription: () => apiClient.get('/my-subscription')
}

// booking endpoints
export const bookingAPI = {
  createBooking: (carId, note = '') =>
    apiClient.post('/bookings', { car_id: carId, note }),
  getMyBookings: () => apiClient.get('/my-bookings'),
  cancelBooking: (bookingId) => apiClient.delete(`/bookings/${bookingId}`)
}

// payment endpoints
export const paymentAPI = {
  createRazorpayOrder: (planId, selectedCarIds, driverServiceDetails = null) =>
    apiClient.post('/payments/razorpay/order', {
      plan_id: planId,
      selected_car_ids: selectedCarIds,
      driver_service_details: driverServiceDetails
    }),

  verifyAndActivateSubscription: (
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    planId,
    selectedCarIds,
    driverServiceDetails = null
  ) =>
    apiClient.post('/payments/razorpay/verify-and-activate', {
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
      plan_id: planId,
      selected_car_ids: selectedCarIds,
      driver_service_details: driverServiceDetails
    })
}

// swap endpoints
export const swapAPI = {
  createSwapRequest: (subscriptionId, fromCarId, toCarId, note = '') =>
    apiClient.post('/swap-request', { subscription_id: subscriptionId, from_car_id: fromCarId, to_car_id: toCarId, note }),
  swapCar: (subscriptionId, toCarId, note = '') =>
    apiClient.post('/swap', { subscription_id: subscriptionId, to_car_id: toCarId, note }),
  getSwapHistory: () => apiClient.get('/swap-history')
}

// contact endpoints
export const contactAPI = {
  submit: (name, email, message) =>
    apiClient.post('/contact', { name, email, message }),

  submitToN8n: async (payload) => {
    const response = await fetch(N8N_CONTACT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed with status ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  },

  submitWithN8n: async (name, email, message) => {
    // Keep database as primary source of truth.
    const dbResponse = await apiClient.post('/contact', { name, email, message })

    const n8nPayload = {
      source: 'carswap-contact-form',
      timestamp: new Date().toISOString(),
      contact: {
        name,
        email,
        message
      },
      database_record: dbResponse.data || null
    }

    try {
      await contactAPI.submitToN8n(n8nPayload)
    } catch (error) {
      console.error('Contact message stored in DB, but n8n sync failed:', error)
    }

    return dbResponse
  }
}

// admin endpoints
export const adminAPI = {
  // Stats
  getStats: () => apiClient.get('/admin/stats'),
  
  // Cars
  listCars: () => apiClient.get('/admin/cars'),
  createCar: (carData) => apiClient.post('/admin/cars', carData),
  createCarWithUpload: (formData) => apiClient.post('/admin/cars/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCar: (carId, carData) => apiClient.put(`/admin/cars/${carId}`, carData),
  deleteCar: (carId) => apiClient.delete(`/admin/cars/${carId}`),
  
  // Plans
  listPlans: () => apiClient.get('/admin/subscription-plans'),
  createPlan: (planData) => apiClient.post('/admin/subscription-plans', planData),
  updatePlan: (planId, planData) => apiClient.put(`/admin/subscription-plans/${planId}`, planData),
  deletePlan: (planId) => apiClient.delete(`/admin/subscription-plans/${planId}`),
  
  // Subscriptions
  listSubscriptions: () => apiClient.get('/admin/subscriptions'),
  
  // Bookings
  listBookings: (status = null) => 
    apiClient.get('/admin/bookings', { params: status ? { status } : {} }),
  approveBooking: (bookingId, adminNote = '') =>
    apiClient.post(`/admin/bookings/${bookingId}/approve`, { admin_note: adminNote }),
  rejectBooking: (bookingId, adminNote = '') =>
    apiClient.post(`/admin/bookings/${bookingId}/reject`, { admin_note: adminNote }),
  
  // Swap Requests
  listSwapRequests: (status = null) =>
    apiClient.get('/admin/swap-requests', { params: status ? { status } : {} }),
  approveSwap: (swapId, adminNote = '') =>
    apiClient.post(`/admin/swap-requests/${swapId}/approve`, { admin_note: adminNote }),
  rejectSwap: (swapId, adminNote = '') =>
    apiClient.post(`/admin/swap-requests/${swapId}/reject`, { admin_note: adminNote }),
  
  // Contacts
  listContacts: () => apiClient.get('/admin/contacts'),
  markContactRead: (contactId) => apiClient.post(`/admin/contacts/${contactId}/read`),
  deleteContact: (contactId) => apiClient.delete(`/admin/contacts/${contactId}`),
  
  // Users
  listUsers: () => apiClient.get('/admin/users'),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`)
}

export default apiClient
