<template>
  <div class="dashboard-page">
    <Navbar @logout="logout" />
    
    <div class="dashboard-container">
      <div v-if="isLoading" class="loading">Loading dashboard...</div>
      
      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else>
        <!-- Welcome Header -->
        <div class="welcome-header">
          <!-- <h1>Welcome back, {{ user?.full_name || 'User' }}!</h1> -->
          <h1>Welcome back, {{ user?.full_name }}!</h1>
          <p>Manage your subscription and browse cars</p>
        </div>

        <!-- Subscription Expired Warning Card -->
        <div v-if="subscription && isSubscriptionExpired" class="subscription-warning-card expired">
          <div class="warning-icon expired">⚠️</div>
          <div class="warning-content">
            <h3>Subscription Expired</h3>
            <p class="warning-message">
              Your vehicle subscription expired on <strong>{{ formatDate(subscription.end_date) }}</strong>.
            </p>
            <p class="warning-subtext">
              Your vehicle subscription has expired. Remote access to your car has been restricted, including engine start functionality.
            </p>
            <p class="warning-subtext">Please renew your subscription to restore full access.</p>
            <p class="warning-subtext">Contact support for assistance.</p>
            <div class="warning-actions">
              <router-link to="/contact" class="cs-btn-support">Contact Support</router-link>
              <button class="cs-btn-return" @click="handleReturnCar" :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Return Car' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Subscription Expiry Warning Card -->
        <div v-else-if="subscription && isSubscriptionExpiringSoon" class="subscription-warning-card">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h3>Subscription Expiring Soon</h3>
            <p class="warning-message">
              Your subscription will expire in <strong>{{ daysUntilExpiry }} day{{ daysUntilExpiry !== 1 ? 's' : '' }}</strong> on <strong>{{ formatDate(subscription.end_date) }}</strong>
            </p>
            <p class="warning-subtext">Choose an option below</p>
            <div class="warning-options">
              <label class="autopay-toggle">
                <input type="checkbox" v-model="enableAutoPay" />
                <span>Enable AutoPay for automatic renewal</span>
              </label>
            </div>
            <div class="warning-actions">
              <button class="cs-btn-autopay" @click="handleAutoPay" :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : (enableAutoPay ? '✓ AutoPay Active' : 'Enable AutoPay') }}
              </button>
              <button class="cs-btn-return" @click="handleReturnCar" :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Return Car' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Active Subscription -->
        <div v-if="subscription" class="subscription-card" :class="{ expired: isSubscriptionExpired }">
          <div class="card-icon">
            <img :src="getCarImage(subscription.car || findCarById(subscription.car_id))" alt="Current car" style="width:56px;height:40px;object-fit:cover;border-radius:8px" />
          </div>
          <div class="card-content">
            <h3>{{ isSubscriptionExpired ? 'Expired Subscription' : 'Active Subscription' }}</h3>
            <div class="sub-grid">
              <div class="sub-item">
                <span class="label">Plan</span>
                <span class="value">{{ subscription.plan?.name }}</span>
              </div>
              <div class="sub-item">
                <span class="label">Current Car</span>
                <span class="value">{{ (subscription.car?.brand && subscription.car?.name) ? subscription.car.brand + ' ' + subscription.car.name : (findCarById(subscription.car_id)?.brand + ' ' + findCarById(subscription.car_id)?.name) }}</span>
              </div>
              <div class="sub-item">
                <span class="label">{{ isSubscriptionExpired ? 'Expired On' : 'Valid Until' }}</span>
                <span class="value">{{ formatDate(subscription.end_date) }}</span>
              </div>
              <div class="sub-item">
                <span class="label">Swaps Available</span>
                <span class="value">{{ subscription.plan?.swap_limit - subscription.swaps_count }} remaining</span>
              </div>
            </div>
            <div class="card-actions">
              <router-link v-if="!isSubscriptionExpired" to="/swap" class="cs-btn-primary">Swap Car</router-link>
              <router-link to="/#vehicles" class="cs-btn-primary">Browse Cars →</router-link>
            </div>
          </div>
        </div>

        <!-- No Subscription -->
        <div v-else class="no-subscription">
          <div class="no-sub-icon">📋</div>
          <h3>No Active Subscription</h3>
          <p>Start your car subscription journey today</p>
          <router-link to="/subscription" class="cs-btn-primary">View Plans</router-link>
        </div>

        <!-- My Bookings Section -->
        <div class="section-card">
          <div class="section-header">
            <h2>My Booking Requests</h2>
            <router-link to="/#vehicles" class="link-btn">Browse Cars →</router-link>
          </div>
          <div v-if="isLoadingBookings" class="loading-small">Loading...</div>
          <div v-else-if="approvedBookings.length === 0" class="empty-state-small">
            <p>No booking requests yet. Browse our cars and request a vehicle!</p>
          </div>
          <div v-else class="booking-list">
            <div v-for="booking in approvedBookings" :key="booking.id" class="booking-item">
              <div class="booking-car">
                <img :src="getCarImage(booking.car || findCarById(booking.car_id))" loading="eager" :alt="(booking.car?.name) || findCarById(booking.car_id)?.name || 'Car'" class="booking-thumb" />
                <div class="booking-details">
                  <h4>{{ (booking.car?.brand && booking.car?.name) ? booking.car.brand + ' ' + booking.car.name : (findCarById(booking.car_id)?.brand + ' ' + findCarById(booking.car_id)?.name) }}</h4>
                  <p>Requested {{ formatDate(booking.created_at) }}</p>
                </div>
              </div>
              <div class="booking-status">
                <span :class="['status-badge', booking.status]">{{ booking.status }}</span>
                <p v-if="booking.admin_note" class="admin-note">{{ booking.admin_note }}</p>
              </div>
              <div class="booking-actions">
                <button v-if="booking.status === 'pending'" class="btn-cancel" @click="cancelBooking(booking.id)" :disabled="isCancelling[booking.id]">
                  {{ isCancelling[booking.id] ? '...' : 'Cancel' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Swap Requests Section -->
        <div v-if="subscription" class="section-card">
          <div class="section-header">
            <h2>My Swap Requests</h2>
            <router-link to="/swap" class="link-btn">Request Swap →</router-link>
          </div>
          <div v-if="isLoadingSwaps" class="loading-small">Loading...</div>
          <div v-else-if="approvedSwaps.length === 0" class="empty-state-small">
            <p>No swap requests yet. Request a car swap from our fleet!</p>
          </div>
          <div v-else class="swap-list">
            <div v-for="swap in approvedSwaps" :key="swap.id" class="swap-item" :class="swap.status">
              <div class="swap-cars">
                <div class="swap-car-detail">
                  <div class="swap-thumb-wrapper">
                    <img :src="getCarImage(swap.from_car || findCarById(swap.from_car_id))" loading="lazy" :alt="(swap.from_car?.name) || (findCarById(swap.from_car_id)?.name) || 'Car'" class="swap-thumb" />
                  </div>
                  <div class="swap-car-text">
                    <span v-if="swap.from_car" class="from-car">{{ swap.from_car.brand + ' ' + swap.from_car.name }}</span>
                    <span v-else-if="findCarById(swap.from_car_id)" class="from-car">{{ findCarById(swap.from_car_id).brand + ' ' + findCarById(swap.from_car_id).name }}</span>
                    <span v-else class="from-car">Current Car</span>
                  </div>
                </div>
                <span class="swap-arrow">→</span>
                <div class="swap-car-detail">
                  <div class="swap-thumb-wrapper">
                    <img :src="getCarImage(swap.to_car || findCarById(swap.to_car_id))" loading="lazy" :alt="(swap.to_car?.name) || (findCarById(swap.to_car_id)?.name) || 'Car'" class="swap-thumb" />
                  </div>
                  <div class="swap-car-text">
                    <span v-if="swap.to_car" class="to-car">{{ swap.to_car.brand + ' ' + swap.to_car.name }}</span>
                    <span v-else-if="findCarById(swap.to_car_id)" class="to-car">{{ findCarById(swap.to_car_id).brand + ' ' + findCarById(swap.to_car_id).name }}</span>
                    <span v-else class="to-car">Select Car</span>
                  </div>
                </div>
              </div>
              <div class="swap-meta">
                <span :class="['status-badge', swap.status || 'pending']">{{ swap.status || 'pending' }}</span>
                <span class="swap-date">{{ formatDate(swap.timestamp) }}</span>
              </div>
              <div v-if="swap.admin_note" class="admin-note">{{ swap.admin_note }}</div>
            </div>
          </div>
        </div>

        <!-- Location Map Card -->
        <MapCard />

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <router-link to="/#vehicles" class="action-card">
              <div class="icon">🚙</div>
              <h4>Browse Cars</h4>
              <p>Explore our fleet</p>
            </router-link>
            <router-link to="/subscription" class="action-card">
              <div class="icon">📄</div>
              <h4>Subscription Plans</h4>
              <p>View all plans</p>
            </router-link>
            <router-link v-if="subscription" to="/swap" class="action-card">
              <div class="icon">🔄</div>
              <h4>Swap Car</h4>
              <p>Change your vehicle</p>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Return Car Modal -->
  <div v-if="showReturnModal" class="modal-overlay" @click.self="cancelReturnModal">
    <div class="modal-content return-modal">
      <button class="modal-close-btn" @click="cancelReturnModal">✕</button>
      
      <div class="modal-header">
        <h2>Return Car Request</h2>
        <p>Submit your car return request for admin approval</p>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Select Car to Return</label>
          <div v-if="returnableCars.length > 0" class="return-car-options">
            <button
              v-for="car in returnableCars"
              :key="car.id"
              type="button"
              class="return-car-option"
              :class="{ selected: selectedReturnCar?.id === car.id }"
              @click="selectedReturnCar = car"
            >
              <img :src="getCarImage(car)" :alt="car.name" class="car-img-return" />
              <div class="car-return-info">
                <strong>{{ car.brand }} {{ car.name }}</strong>
                <small>{{ car.category || 'Sedan' }}</small>
              </div>
            </button>
          </div>
          <div v-else class="empty-state-small">
            <p>No active cars are available to return right now.</p>
          </div>
          <div v-if="selectedReturnCar" class="selected-return-caption">
            Selected: {{ selectedReturnCar.brand }} {{ selectedReturnCar.name }}
          </div>
        </div>

        <div class="form-group">
          <label for="returnReason">Reason for Return (Optional)</label>
          <textarea
            id="returnReason"
            v-model="returnReason"
            class="form-control"
            placeholder="E.g., Vehicle damage, dissatisfied with car, need to cancel subscription..."
            rows="4"
          ></textarea>
        </div>

        <div class="form-info-box">
          <h4>⚠️ Important</h4>
          <ul>
            <li>Only the selected car will be removed from your active cars</li>
            <li>The car will be marked as available for other users</li>
            <li>Admin will contact you with return logistics</li>
            <li>If no cars remain, the subscription will be ended</li>
          </ul>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" @click="cancelReturnModal" :disabled="isProcessing">
          Cancel
        </button>
        <button class="btn-danger" @click="submitReturnRequest" :disabled="isProcessing">
          {{ isProcessing ? 'Submitting...' : 'Submit Return Request' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import MapCard from '../components/MapCard.vue'
import { bookingAPI, paymentAPI, subscriptionAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import { useUser } from '../composables/useUser'

const cacheStore = useCacheStore()
const isLoading = ref(true)
const isLoadingBookings = ref(false)
const isLoadingSwaps = ref(false)
const isCancelling = reactive({})
const errorMessage = ref('')
const enableAutoPay = ref(false)
const isProcessing = ref(false)
const isRazorpayLoaded = ref(false)
const router = useRouter()

// Return car modal state
const showReturnModal = ref(false)
const returnReason = ref('')
const selectedReturnCar = ref(null)
const returnableCars = ref([])

// Use data from Pinia cache (NO API CALLS)
const user = computed(() => cacheStore.currentUser)
const subscription = computed(() => cacheStore.userSubscription)
const bookings = computed(() => cacheStore.userBookings)
const swapHistory = computed(() => cacheStore.swapHistory)
const currentSubscriptionPlanId = computed(() => subscription.value?.plan?.id || null)

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCarImage = (car) => {
  const placeholder = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop'
  if (!car) return placeholder
  if (car.image) {
    if (car.image.startsWith('http')) return car.image
    return `https://cardb-1.onrender.com${car.image}`
  }
  return placeholder
}

const findCarById = (id) => {
  if (id == null) return null
  const carsList = cacheStore.cars || []
  return carsList.find(c => c.id == id) || null
}

const buildReturnableCars = (returnRequests = []) => {
  if (!subscription.value) return []
  const seenCarIds = new Set()
  const swappedFromIds = new Set()
  const activeCarEntries = []

  const addCandidateCar = (car, createdAt, source) => {
    if (!car?.id || seenCarIds.has(car.id)) {
      return
    }

    seenCarIds.add(car.id)
    activeCarEntries.push({
      id: `${source}_${car.id}_${createdAt || 'current'}`,
      car,
      created_at: createdAt || new Date().toISOString()
    })
  }

  const latestReturnTimes = new Map()
  for (const returnRequest of returnRequests) {
    if (!['pending', 'approved'].includes((returnRequest.status || '').toLowerCase()) || !returnRequest.car_id) {
      continue
    }
    const returnSeenAt = new Date(returnRequest.updated_at || returnRequest.created_at || Date.now())
    const previousSeenAt = latestReturnTimes.get(returnRequest.car_id)
    if (!previousSeenAt || returnSeenAt > previousSeenAt) {
      latestReturnTimes.set(returnRequest.car_id, returnSeenAt)
    }
  }

  addCandidateCar(subscription.value.car || findCarById(subscription.value.car_id), subscription.value.start_date, 'subscription')

  for (const booking of bookings.value || []) {
    if (booking.status !== 'approved') {
      continue
    }
    addCandidateCar(booking.car || findCarById(booking.car_id), booking.created_at, 'booking')
  }

  const approvedSwaps = (swapHistory.value || []).filter(
    swap => swap.status === 'approved'
  )
  for (const swap of approvedSwaps) {
    if (swap.from_car_id) {
      swappedFromIds.add(swap.from_car_id)
    }
    addCandidateCar(swap.to_car || findCarById(swap.to_car_id), swap.timestamp, 'swap')
  }

  return activeCarEntries
    .filter(entry => {
      if (!entry.car?.id || swappedFromIds.has(entry.car.id)) {
        return false
      }
      const latestReturnAt = latestReturnTimes.get(entry.car.id)
      return !latestReturnAt || new Date(entry.created_at) > latestReturnAt
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(entry => entry.car)
}

// Prefetch any missing cars referenced in bookings/swaps/subscription
const prefetchMissingCars = async () => {
  try {
    // bookings
    for (const b of bookings.value || []) {
      if (!b.car && b.car_id) {
        await cacheStore.fetchCarById(b.car_id)
      }
    }

    // swaps
    for (const s of swapHistory.value || []) {
      if (!s.from_car && s.from_car_id) {
        await cacheStore.fetchCarById(s.from_car_id)
      }
      if (!s.to_car && s.to_car_id) {
        await cacheStore.fetchCarById(s.to_car_id)
      }
    }

    // subscription current car
    if (subscription.value && !subscription.value.car && subscription.value.car_id) {
      await cacheStore.fetchCarById(subscription.value.car_id)
    }
  } catch (e) {
    console.error('Prefetch cars error', e)
  }
}

const loadUserData = async () => {
  // Data already loaded in App.vue - use from cache
}

const loadSubscription = async () => {
  // Data already loaded in App.vue - use from cache
}

const loadSwapHistory = async () => {
  // Data already loaded in App.vue - use from cache
}

const loadBookings = async () => {
  // Data already loaded in App.vue - use from cache
}

const cancelBooking = async (bookingId) => {
  if (!confirm('Are you sure you want to cancel this booking request?')) return
  isCancelling[bookingId] = true
  try {
    await bookingAPI.cancelBooking(bookingId)
    await cacheStore.refreshUserData()
  } catch (error) {
    alert(error.response?.data?.detail || 'Failed to cancel booking')
  } finally {
    delete isCancelling[bookingId]
  }
}

const logout = () => {
  const { clearUser } = useUser()
  clearUser()
  router.push('/login')
}

const loadRazorpayScript = () => {
  if (window.Razorpay) {
    isRazorpayLoaded.value = true
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      isRazorpayLoaded.value = true
      resolve(true)
    }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const openRazorpayRenewalPopup = async (orderData, planId) => {
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: 'CarSwap',
    description: 'Subscription Renewal - 1 Month Extension',
    order_id: orderData.order_id,
    prefill: {
      name: user.value?.full_name || '',
      email: user.value?.email || '',
      contact: user.value?.phone || ''
    },
    theme: {
      color: '#d97706'
    },
    modal: {
      ondismiss: () => {
        isProcessing.value = false
      }
    },
    handler: async (response) => {
      try {
        await paymentAPI.verifyRenewalPayment(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
          planId
        )

        // Refresh subscription data
        await cacheStore.refreshUserData()
        
        errorMessage.value = ''
        alert('Your subscription has been successfully renewed for 1 more month!')
        enableAutoPay.value = false
      } catch (error) {
        console.error('Payment verification/renewal failed:', error)
        errorMessage.value = error.response?.data?.detail || 'Payment successful, but renewal failed. Please contact support.'
      } finally {
        isProcessing.value = false
      }
    }
  }

  const razorpay = new window.Razorpay(options)
  razorpay.on('payment.failed', (response) => {
    console.error('Razorpay payment failed:', response)
    errorMessage.value = response?.error?.description || 'Payment failed. Please try again.'
    isProcessing.value = false
  })
  razorpay.open()
}

const handleAutoPay = async () => {
  if (!enableAutoPay.value) {
    alert('Please enable AutoPay first')
    return
  }

  if (!subscription.value) {
    alert('No subscription found to renew')
    return
  }

  if (!currentSubscriptionPlanId.value) {
    errorMessage.value = 'Unable to determine the active plan for renewal.'
    return
  }
  
  isProcessing.value = true
  try {
    // Load Razorpay script if not loaded
    if (!isRazorpayLoaded.value && !(await loadRazorpayScript())) {
      throw new Error('Unable to load Razorpay checkout script')
    }

    // Create renewal order
    const orderRes = await paymentAPI.createRazorpayRenewalOrder(currentSubscriptionPlanId.value)
    const orderData = orderRes.data

    // Open Razorpay popup
    await openRazorpayRenewalPopup(orderData, currentSubscriptionPlanId.value)
  } catch (error) {
    console.error('AutoPay error:', error)
    errorMessage.value = error.response?.data?.detail || error.message || 'Failed to process AutoPay. Please try again.'
    isProcessing.value = false
  }
}

const handleReturnCar = async () => {
  if (!subscription.value) {
    alert('No active subscription found')
    return
  }

  const returnRequestsResponse = await subscriptionAPI.getMyReturnRequests().catch(() => null)
  const availableReturnCars = buildReturnableCars(returnRequestsResponse?.data || [])
  if (availableReturnCars.length === 0) {
    alert('No active cars are available to return right now')
    return
  }

  returnableCars.value = availableReturnCars
  selectedReturnCar.value = availableReturnCars[0]
  showReturnModal.value = true
  returnReason.value = ''
}

const submitReturnRequest = async () => {
  if (!selectedReturnCar.value) {
    alert('Please select a car to return')
    return
  }
  
  if (!subscription.value) {
    alert('No active subscription found')
    return
  }
  
  isProcessing.value = true
  try {
    const response = await subscriptionAPI.createReturnRequest(
      subscription.value.id,
      selectedReturnCar.value.id,
      returnReason.value || ''
    )
    
    // Clear form
    showReturnModal.value = false
    returnReason.value = ''
    selectedReturnCar.value = null
    returnableCars.value = []
    
    alert('✓ Your car return request has been submitted successfully! Our team will review and contact you shortly.')
    
    // Reload user-side data
    await cacheStore.refreshUserData().catch(() => {})
  } catch (error) {
    console.error('Return request failed:', error)
    alert(error.response?.data?.detail || 'Failed to submit return request. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

const cancelReturnModal = () => {
  showReturnModal.value = false
  returnReason.value = ''
  selectedReturnCar.value = null
  returnableCars.value = []
}

// Filter bookings to show pending and approved ones
const approvedBookings = computed(() => {
  return bookings.value
    .filter(booking => booking.status === 'pending' || booking.status === 'approved')
    .map(b => ({ ...b, car: b.car || findCarById(b.car_id) || null }))
})

// Filter swaps to show pending and approved ones
const approvedSwaps = computed(() => {
  return swapHistory.value
    .filter(swap => swap.status === 'pending' || swap.status === 'approved')
    .map(swap => ({
      ...swap,
      from_car: swap.from_car || findCarById(swap.from_car_id) || null,
      to_car: swap.to_car || findCarById(swap.to_car_id) || null,
    }))
})

// Calculate days until subscription expiry
const daysUntilExpiry = computed(() => {
  if (!subscription.value || !subscription.value.end_date) return 0
  const endDate = new Date(subscription.value.end_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  const timeDiff = endDate - today
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
})

const isSubscriptionExpired = computed(() => {
  if (!subscription.value || !subscription.value.end_date) return false
  return daysUntilExpiry.value < 0
})

// Check if subscription expires within 5 days
const isSubscriptionExpiringSoon = computed(() => {
  if (!subscription.value || !subscription.value.end_date) return false
  const daysRemaining = daysUntilExpiry.value
  return !isSubscriptionExpired.value && daysRemaining > 0 && daysRemaining <= 5
})

onMounted(async () => {
  // Data already loaded in App.vue via cache store
  // No API calls needed - just display cached data
  // ensure cars cache is loaded and any missing car objects are fetched
  await cacheStore.loadCars().catch(() => {})
  await prefetchMissingCars()
  isLoading.value = false
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: var(--cs-navbar-offset);
}

.dashboard-container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.1rem;
}

.welcome-header {
  margin-bottom: 30px;
}

.welcome-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}

.welcome-header p {
  color: #666;
}

.subscription-warning-card {
  background: linear-gradient(135deg, #fff8e1 0%, #ffe8cc 100%);
  border-radius: 20px;
  padding: 24px 30px;
  margin-bottom: 30px;
  display: flex;
  gap: 20px;
  border: 2px solid #ffc107;
  box-shadow: 0 4px 20px rgba(255, 193, 7, 0.15);
  align-items: flex-start;
}

.subscription-warning-card.expired {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border-color: #ef4444;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
}

.warning-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  padding-top: 4px;
}

.warning-icon.expired {
  color: #dc2626;
}

.warning-content {
  flex: 1;
}

.warning-content h3 {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #d97706;
}

.subscription-warning-card.expired .warning-content h3 {
  color: #b91c1c;
}

.warning-message {
  margin: 8px 0;
  color: #92400e;
  font-weight: 500;
}

.subscription-warning-card.expired .warning-message,
.subscription-warning-card.expired .warning-subtext,
.subscription-warning-card.expired .autopay-toggle span {
  color: #991b1b;
}

.warning-subtext {
  margin: 8px 0 16px 0;
  color: #b45309;
  font-size: 0.95rem;
}

.warning-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.warning-actions .cs-btn-primary {
  padding: 10px 20px;
  background: #d97706;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: background 0.3s ease;
}

.warning-actions .cs-btn-primary:hover {
  background: #b45309;
}

.warning-options {
  margin: 12px 0 16px 0;
}

.autopay-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.autopay-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #d97706;
}

.autopay-toggle span {
  color: #92400e;
  font-weight: 500;
  font-size: 0.95rem;
}

.cs-btn-autopay,
.cs-btn-return {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cs-btn-autopay {
  background: #d97706;
}

.cs-btn-autopay:hover:not(:disabled) {
  background: #b45309;
}

.cs-btn-return {
  background: #6366f1;
}

.cs-btn-return:hover:not(:disabled) {
  background: #4f46e5;
}

.cs-btn-autopay:disabled,
.cs-btn-return:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cs-btn-support {
  padding: 10px 20px;
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cs-btn-support:hover {
  background: #fee2e2;
}

.subscription-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 30px;
  color: #111;
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.subscription-card.expired {
  border-color: #fecaca;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.08);
}

.card-icon {
  font-size: 3rem;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.sub-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.sub-item .label {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.sub-item .value {
  font-weight: 600;
  font-size: 1.05rem;
  color: #111;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.card-actions .cs-btn-ghost {
  background: #fff;
  color: #333;
  border: 1px solid #d4d8e2;
}

.no-subscription {
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.no-sub-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.no-subscription h3 {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.no-subscription p {
  color: #666;
  margin-bottom: 20px;
}

/* Section cards */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.link-btn {
  color: var(--primary, #ff4d30);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.link-btn:hover {
  text-decoration: underline;
}

.loading-small {
  color: #666;
  padding: 1rem 0;
}

.empty-state-small {
  color: #888;
  padding: 2rem 0;
  text-align: center;
}

.empty-state-small p {
  margin: 0;
}

/* Booking list */
.booking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 12px;
}

.booking-car {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.booking-thumb {
  width: 80px;
  height: 55px;
  object-fit: cover;
  border-radius: 8px;
}

.booking-thumb-placeholder {
  width: 80px;
  height: 55px;
  background: #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.booking-details h4 {
  font-size: 1rem;
  margin: 0 0 4px 0;
}

.booking-details p {
  font-size: 0.85rem;
  color: #888;
  margin: 0;
}

.booking-status {
  text-align: center;
}

.admin-note {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.booking-actions {
  min-width: 80px;
  text-align: right;
}

.btn-cancel {
  background: #ffebee;
  color: #c62828;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #ffcdd2;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #fff3e0;
  color: #e65100;
}

.status-badge.approved {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.rejected {
  background: #ffebee;
  color: #c62828;
}

.status-badge.completed {
  background: #e3f2fd;
  color: #1565c0;
}

/* Swap history */
.swap-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.swap-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #fafafa;
  border-radius: 12px;
  border-left: 4px solid #ddd;
  gap: 0.75rem;
}

.swap-item.pending {
  background: #fffbf0;
  border-left-color: #ff9800;
}

.swap-item.approved {
  background: #f1f8f5;
  border-left-color: #4caf50;
}

.swap-item.rejected {
  background: #fff5f5;
  border-left-color: #f44336;
}

.swap-cars {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.swap-thumb-wrapper {
  width: 80px;
  height: 55px;
  flex: 0 0 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-thumb {
  width: 80px;
  height: 55px;
  object-fit: cover;
  border-radius: 8px;
}

.swap-car-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.swap-car-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.from-car, .to-car {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.swap-arrow {
  color: var(--primary, #ff4d30);
  font-size: 1.3rem;
  font-weight: bold;
}

.swap-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.swap-date {
  color: #888;
  font-size: 0.85rem;
}

.swap-item .admin-note {
  width: 100%;
  font-size: 0.8rem;
  color: #666;
  padding-top: 0.5rem;
  border-top: 1px dashed #ddd;
  margin-top: 0.5rem;
}

/* Quick actions */
.quick-actions h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.action-card .icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.action-card h4 {
  font-size: 1rem;
  margin-bottom: 4px;
  color: #111;
}

.action-card p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.alert {
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-danger {
  background: #ffebee;
  color: #c62828;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .subscription-card {
    flex-direction: column;
  }
  
  .sub-grid {
    grid-template-columns: 1fr;
  }
  
  .booking-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .booking-status {
    text-align: left;
  }
  
  .booking-actions {
    width: 100%;
    text-align: left;
  }
  
  .swap-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .swap-cars {
    flex-wrap: wrap;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.return-modal {
  padding: 2rem;
}

.modal-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-header {
  margin-bottom: 1.5rem;
  padding-right: 2rem;
}

.modal-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  color: #111;
}

.modal-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.selected-car-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.car-img-return {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
}

.car-return-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.car-return-info strong {
  color: #111;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.car-return-info small {
  color: #666;
  font-size: 0.85rem;
}

.return-car-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.9rem;
}

.return-car-option {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
  width: 100%;
  padding: 0.9rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.return-car-option:hover {
  border-color: #6366f1;
  background: #f5f7ff;
}

.return-car-option.selected {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.12);
}

.selected-return-caption {
  margin-top: 0.75rem;
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-info-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-info-box h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #856404;
}

.form-info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.form-info-box li {
  color: #856404;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  padding-left: 1.25rem;
  position: relative;
}

.form-info-box li:before {
  content: "•";
  position: absolute;
  left: 0;
}

.form-info-box li:last-child {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .modal-content {
    max-width: 100%;
  }
  
  .return-modal {
    padding: 1.5rem;
  }
  
  .modal-header {
    padding-right: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  .btn-secondary,
  .btn-danger {
    width: 100%;
  }
}
</style>

