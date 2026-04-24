<template>
  <Navbar @logout="logout" />
  <div class="section-container mt-4">
    <div class="cars-container">
      <!-- Main Content Area -->
      <div class="cars-main">
        <div class="cars-header-wrapper">
          <div class="header-title">
            <h2>Our Fleet</h2>
              <p class="fleet-description">Choose from our curated selection of premium vehicles</p>
          </div>
          <div class="filter-buttons">
            <button 
              v-for="tier in ['Basic', 'Premium', 'Luxury']"
              :key="tier"
              class="filter-btn"
              :class="{ active: selectedTier === tier.toLowerCase() }"
              @click="selectedTier = selectedTier === tier.toLowerCase() ? '' : tier.toLowerCase()"
            >
              {{ tier }}
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="alert alert-info">Loading cars...</div>
        <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-else-if="!subscription" class="alert alert-warning">
          <strong>Get a subscription first!</strong> Subscribe to a plan to see cars available for your tier. You can then swap cars as needed.
        </div>
        <div v-else>
          <!-- Subscription Plan Info -->
          <div class="subscription-info-card">
            <div class="info-header">
              <h3>{{ subscription.plan?.name }} Plan</h3>
              <span class="plan-badge">{{ (subscription.plan?.tier || 'basic').toUpperCase() }}</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Active Bookings:</span>
                <span class="value" :class="{ warning: activeBookingsCount >= subscription.plan?.max_active_bookings }">
                  {{ activeBookingsCount }} / {{ subscription.plan?.max_active_bookings }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Swaps Available:</span>
                <span class="value" :class="{ warning: remainingSwaps <= 1 }">
                  {{ remainingSwaps }} / {{ subscription.plan?.swap_limit }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Current Car:</span>
                <span class="value">{{ subscription.car?.brand }} {{ subscription.car?.name }}</span>
              </div>
            </div>
            <div v-if="activeBookingsCount >= subscription.plan?.max_active_bookings" class="booking-limit-notice">
              ℹ️ You've reached your booking limit. Use <strong>Swap</strong> to change your car instead.
            </div>
          </div>

          <div v-if="filteredCars.length === 0" class="alert alert-warning">
            No cars found matching your filters. Try adjusting your selection.
          </div>
          <div v-else class="cs-grid">
            <CarCard 
              v-for="car in filteredCars" 
              :key="car.id" 
              :car="car" 
              :subscription="subscription"
              @subscribe="selectCar" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { subscriptionAPI, bookingAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import CarCard from '../components/CarCard.vue'

const cacheStore = useCacheStore()
const subscription = ref(null)
const bookings = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const selectedTier = ref('')
const selectedCategory = ref('')
const router = useRouter()

// Use cars from Pinia cache store (no API call)
const cars = computed(() => cacheStore.cars)

// Tier access hierarchy
const tierAccess = {
  'basic': ['basic'],
  'premium': ['basic', 'premium'],
  'luxury': ['basic', 'premium', 'luxury']
}

// Filter cars by subscription plan tier AND available tiers
const filteredCars = computed(() => {
  if (!subscription.value) return cars.value
  
  const planTier = subscription.value.plan?.tier || 'basic'
  const allowedTiers = tierAccess[planTier] || ['basic']
  const currentCarId = subscription.value.car?.id
  
  return cars.value.filter(car => {
    const carTier = (car.required_plan || 'basic').toLowerCase()
    const carCategory = (car.category || 'sedan').toLowerCase()
    
    // Check tier access for subscription plan
    const hasAccess = allowedTiers.includes(carTier)
    
    // Check tier filter
    const tierMatch = !selectedTier.value || carTier === selectedTier.value.toLowerCase()
    
    // Check category filter
    const categoryMatch = !selectedCategory.value || carCategory === selectedCategory.value.toLowerCase()
    
    // Exclude already booked car
    const notBooked = car.id !== currentCarId
    
    return hasAccess && tierMatch && categoryMatch && notBooked
  })
})

const activeBookingsCount = computed(() => {
  return bookings.value.filter(b => b.status === 'approved').length
})

const remainingSwaps = computed(() => {
  if (!subscription.value || !subscription.value.plan) return 0
  return Math.max(0, subscription.value.plan.swap_limit - subscription.value.swaps_count)
})

const resetFilters = () => {
  selectedTier.value = ''
  selectedCategory.value = ''
}

const loadData = async () => {
  try {
    // Load subscription first
    try {
      const subResponse = await subscriptionAPI.getUserSubscription()
      subscription.value = subResponse.data
    } catch (error) {
      console.log('No active subscription')
      subscription.value = null
    }
    
    // Load bookings to show active bookings count
    try {
      if (subscription.value) {
        const bookingsResponse = await bookingAPI.getMyBookings()
        bookings.value = bookingsResponse.data
      }
    } catch (error) {
      console.log('No bookings')
      bookings.value = []
    }
    
    // Cars are already in cache from App.vue - NO API CALL HERE
  } catch (error) {
    console.error('Failed to load data:', error)
    errorMessage.value = 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

const selectCar = (car) => {
  const token = localStorage.getItem('access_token')
  
  // If not logged in, redirect to login and return to cars page after
  if (!token) {
    localStorage.setItem('selectedCarForSubscription', JSON.stringify(car))
    router.push({
      path: '/login',
      query: { redirect: '/subscription' }
    })
    return
  }
  
  // If logged in, store car and redirect to subscription
  localStorage.setItem('selectedCarForSubscription', JSON.stringify(car))
  router.push('/subscription')
}

const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  loadData()
})


</script>

<style scoped>
.section-container {
  padding-top: var(--cs-navbar-offset, 80px) !important;
  min-height: 100vh;
  background: #f5f6fa;
}

.cars-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.cars-main {
  min-width: 0;
}

.cars-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.cars-header-wrapper h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.fleet-description {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: capitalize;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: #ff5722;
  color: #ff5722;
}

.filter-btn.active {
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: white;
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
}

.cs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

@media (max-width: 768px) {
  .cars-header-wrapper {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-buttons {
    justify-content: flex-start;
  }

  .cs-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

/* Subscription Info Card */
.subscription-info-card {
  background: linear-gradient(135deg, #fff5f1 0%, #ffe8df 100%);
  border: 2px solid #ff5722;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ff5722;
}

.info-header h3 {
  margin: 0;
  color: #1a1a2e;
  font-size: 1.3rem;
  font-weight: 700;
}

.plan-badge {
  background: #ff5722;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #ffccc7;
}

.info-item .label {
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
}

.info-item .value {
  color: #ff5722;
  font-weight: 700;
  font-size: 1.1rem;
}

.info-item .value.warning {
  color: #d32f2f;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.booking-limit-notice {
  background: #ffebee;
  border-left: 4px solid #d32f2f;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  color: #d32f2f;
  font-size: 0.95rem;
  font-weight: 500;
}
</style>