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

        <!-- Active Subscription -->
        <div v-if="subscription" class="subscription-card">
          <div class="card-icon">🚗</div>
          <div class="card-content">
            <h3>Active Subscription</h3>
            <div class="sub-grid">
              <div class="sub-item">
                <span class="label">Plan</span>
                <span class="value">{{ subscription.plan?.name }}</span>
              </div>
              <div class="sub-item">
                <span class="label">Current Car</span>
                <span class="value">{{ subscription.car?.brand }} {{ subscription.car?.name }}</span>
              </div>
              <div class="sub-item">
                <span class="label">Valid Until</span>
                <span class="value">{{ formatDate(subscription.end_date) }}</span>
              </div>
              <div class="sub-item">
                <span class="label">Swaps Available</span>
                <span class="value">{{ subscription.plan?.swap_limit - subscription.swaps_count }} remaining</span>
              </div>
            </div>
            <div class="card-actions">
              <router-link to="/swap" class="cs-btn-primary">Swap Car</router-link>
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
                <img v-if="booking.car?.image" :src="getCarImage(booking.car)" loading="eager" :alt="booking.car.name" class="booking-thumb" />
                <div v-else class="booking-thumb-placeholder">🚗</div>
                <div class="booking-details">
                  <h4>{{ booking.car?.brand }} {{ booking.car?.name }}</h4>
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
                  <span v-if="swap.from_car" class="from-car">
                    {{ swap.from_car.brand }} {{ swap.from_car.name }}
                  </span>
                  <span v-else class="from-car">Current Car</span>
                </div>
                <span class="swap-arrow">→</span>
                <div class="swap-car-detail">
                  <span v-if="swap.to_car" class="to-car">
                    {{ swap.to_car.brand }} {{ swap.to_car.name }}
                  </span>
                  <span v-else class="to-car">Car #{{ swap.to_car_id }}</span>
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import MapCard from '../components/MapCard.vue'
import { carsAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import { useUser } from '../composables/useUser'

const cacheStore = useCacheStore()
const isLoading = ref(true)
const isLoadingBookings = ref(false)
const isLoadingSwaps = ref(false)
const isCancelling = reactive({})
const errorMessage = ref('')
const router = useRouter()

// Use data from Pinia cache (NO API CALLS)
const user = computed(() => cacheStore.currentUser)
const subscription = computed(() => cacheStore.userSubscription)
const bookings = computed(() => cacheStore.userBookings)
const swapHistory = computed(() => cacheStore.swapHistory)

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCarImage = (car) => {
  if (!car?.image) return null
  if (car.image.startsWith('http')) return car.image
  return `https://cardb-1.onrender.com${car.image}`
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
    await loadBookings()
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

// Filter bookings to show pending and approved ones
const approvedBookings = computed(() => {
  return bookings.value.filter(booking => booking.status === 'pending' || booking.status === 'approved')
})

// Filter swaps to show pending and approved ones
const approvedSwaps = computed(() => {
  const carMap = new Map((cacheStore.cars || []).map(car => [car.id, car]))
  return swapHistory.value
    .filter(swap => swap.status === 'pending' || swap.status === 'approved')
    .map(swap => ({
      ...swap,
      from_car: swap.from_car || carMap.get(swap.from_car_id) || null,
      to_car: swap.to_car || carMap.get(swap.to_car_id) || null,
    }))
})

onMounted(async () => {
  // Data already loaded in App.vue via cache store
  // No API calls needed - just display cached data
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
</style>
