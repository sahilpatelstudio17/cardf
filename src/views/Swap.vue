<template>
  <div class="swap-page">
    <Navbar @logout="logout" />
    
    <div class="swap-container">
      <div v-if="isLoading" class="loading">Loading swap information...</div>
      
      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else-if="!subscription" class="no-subscription">
        <div class="no-sub-icon">📋</div>
        <h3>No Active Subscription</h3>
        <p>You need an active subscription to swap cars</p>
        <router-link to="/subscription" class="cs-btn-primary">View Plans</router-link>
      </div>

      <div v-else-if="!subscription.car" class="no-booking">
        <div class="no-booking-icon">🚗</div>
        <h3>No Car Selected in Subscription</h3>
        <p>You don't have a car selected yet. Please select a car from your subscription first.</p>
        <router-link to="/subscription" class="cs-btn-primary">Select a Car</router-link>
      </div>

      <div v-else>
        <!-- Header -->
        <div class="swap-header">
          <h1>Swap Your Car</h1>
          <p>Select a car to return and choose a new one</p>
        </div>

        <!-- Step 1: Select Car to Return -->
        <div class="swap-step step-1">
          <div class="step-header">
            <div class="step-number">1</div>
            <div class="step-info">
              <div class="step-title">Select Car to Return</div>
              <p class="step-subtitle">Choose the car you want to return</p>
            </div>
          </div>
          
          <div v-if="bookings.length > 0" class="return-car-selection">
            <div class="booking-cards-grid">
              <div 
                v-for="booking in bookings" 
                :key="booking.id"
                class="return-car-card"
                :class="{ selected: selectedFromCar?.id === booking.car?.id }"
                @click="selectedFromCar = booking.car"
              >
                <div v-if="booking.car?.image" class="car-image-medium">
                  <img :src="getCarImage(booking.car)" loading="lazy" :alt="booking.car?.name" />
                </div>
                <div v-else class="placeholder">🚗</div>
                <div class="car-name-return">{{ booking.car?.brand }} {{ booking.car?.name }}</div>
                <div v-if="selectedFromCar?.id === booking.car?.id" class="checkmark">✓</div>
              </div>
            </div>
          </div>
          <div v-else class="current-car-card">
            <div class="current-label">Current Vehicle to Return</div>
            <div class="current-info">
              <div v-if="selectedFromCar?.image" class="car-image-large">
                <img :src="getCarImage(selectedFromCar)" loading="lazy" :alt="selectedFromCar?.name" />
              </div>
              <div class="car-name">{{ selectedFromCar?.brand }} {{ selectedFromCar?.name }}</div>
            </div>
          </div>
        </div>

        <!-- Swap Arrow -->
        <!-- <div class="swap-arrow-container">
          <div class="swap-arrow">↓</div>
          <p class="arrow-label">Swap For</p>
          <div class="swap-arrow">↓</div>
        </div> -->

        <!-- Swap Status Info -->
        <div class="swap-info-bar">
          <div class="swap-counter">
            <span class="label">Plan:</span>
            <span class="plan-name">{{ subscription.plan?.name }}</span>
          </div>
          <div class="swap-status">
            <span class="label">Swaps Remaining:</span>
            <span class="value" :class="{ 'low-limit': remainingSwaps <= 1 }">
              {{ remainingSwaps }} / {{ subscription.plan?.swap_limit }}
            </span>
            <div v-if="remainingSwaps > 0" class="swap-progress">
              <div class="progress-bar" :style="{ width: swapProgressPercent + '%' }"></div>
            </div>
          </div>
          <div v-if="!canSwap" class="limit-warning">
            ⚠️ You have reached your swap limit
          </div>
        </div>

        <!-- Pending Swap Request -->
        <div v-if="pendingSwap" class="pending-swap-card">
          <div class="pending-icon">⏳</div>
          <div class="pending-content">
            <h3>Swap Request Pending</h3>
            <p>You have a pending swap request waiting for admin approval</p>
            <div class="pending-details">
              <span class="from">{{ subscription.car?.brand }} {{ subscription.car?.name }}</span>
              <span class="arrow">→</span>
              <span class="to">{{ pendingSwap.to_car?.brand }} {{ pendingSwap.to_car?.name }}</span>
            </div>
            <span class="status-badge pending">Pending Approval</span>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <!-- Select New Car Button -->
        <div v-if="canSwap && !pendingSwap && !showCarSelection" class="select-car-button-section">
          <button class="cs-btn-primary select-car-btn" @click="showCarSelection = true">
            Select New Car
          </button>
        </div>

        <!-- Step 2: Select New Car -->
        <div v-if="canSwap && !pendingSwap" class="swap-step step-2">
          <div class="step-header">
            <div class="step-number">2</div>
            <div class="step-info">
              <div class="step-title">Select Your New Car</div>
              <p class="step-subtitle">Choose which car you want to swap for</p>
            </div>
          </div>
          <div class="car-selection">
          <div class="selection-header">
            <h2>Available Cars</h2>
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
          
          <div class="cars-grid">
            <div 
              v-for="car in filteredCars" 
              :key="car.id" 
              class="car-swap-card"
              :class="{ selected: selectedCar?.id === car.id }"
              @click="selectCarAndScroll(car)"
            >
              <div class="car-image">
                <img 
                  v-if="car.image" 
                  :src="getCarImage(car)" 
                  loading="lazy"
                  :alt="car.name"
                >
                <div v-else class="placeholder">🚗</div>
                <span :class="['car-status-badge', car.available ? 'available' : 'in-use']">
                  {{ car.available ? '✓ Available' : '⏳ In Use' }}
                </span>
              </div>
              <div class="car-info">
                <h4>{{ car.brand }} {{ car.name }}</h4>
                <p v-if="car.category">{{ car.category }}</p>
              </div>
              <div class="select-indicator">
                <span v-if="selectedCar?.id === car.id">✓ Selected</span>
                <span v-else>Select</span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredCars.length === 0" class="no-cars-message">
            <p>No cars available matching your tier.</p>
          </div>

          <!-- Note Input -->
          <div v-if="selectedCar" ref="noteSection" class="swap-note">
            <label>Add a note (optional)</label>
            <textarea 
              v-model="note" 
              placeholder="Any special requests or notes about your swap..."
              rows="3"
            ></textarea>
          </div>

          <!-- Confirm Button -->
          <div v-if="selectedCar" class="confirm-section">
            <div class="new-car-display">
              <div v-if="selectedCar.image" class="selected-car-image">
                <img :src="getCarImage(selectedCar)" loading="lazy" :alt="selectedCar.name" />
              </div>
              <div class="swap-summary">
                <span class="swap-label">Swapping to:</span>
                <strong class="new-car-name">{{ selectedCar.brand }} {{ selectedCar.name }}</strong>
              </div>
            </div>
            <button @click="requestSwap" class="cs-btn-primary confirm-btn" :disabled="isSwapping">
              {{ isSwapping ? 'Submitting...' : 'Request Swap' }}
            </button>
          </div>
          <p class="swap-note-info">* Swap requests require admin approval. You will be notified once approved.</p>
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
import { carsAPI, swapAPI, bookingAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'

const cacheStore = useCacheStore()
const bookings = ref([])
const availableCars = ref([])
const selectedFromCar = ref(null)
const selectedCar = ref(null)
const pendingSwap = ref(null)
const isLoading = ref(true)
const isSwapping = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const note = ref('')
const noteSection = ref(null)
const showCarSelection = ref(true)
const selectedTier = ref('')
const router = useRouter()

// Use subscription from cache (NO API CALL)
const subscription = computed(() => cacheStore.userSubscription)

// Select car and scroll to note section
const selectCarAndScroll = (car) => {
  selectedCar.value = car
  // Scroll to note section after car selection
  setTimeout(() => {
    if (noteSection.value) {
      noteSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

// Image helper
const getCarImage = (car) => {
  if (!car?.image) return null
  if (car.image.startsWith('http')) return car.image
  return `https://cardb-1.onrender.com${car.image}`
}

const remainingSwaps = computed(() => {
  if (!subscription.value || !subscription.value.plan) return 0
  return Math.max(0, subscription.value.plan.swap_limit - subscription.value.swaps_count)
})

const swapProgressPercent = computed(() => {
  if (!subscription.value || !subscription.value.plan) return 0
  const limit = subscription.value.plan.swap_limit
  const used = subscription.value.swaps_count
  return (used / limit) * 100
})

const canSwap = computed(() => {
  return subscription.value && 
         subscription.value.swaps_count < subscription.value.plan?.swap_limit
})

const filteredCars = computed(() => {
  const base = availableCars.value.filter(car => car.id !== selectedFromCar.value?.id)
  if (!selectedTier.value) return base
  return base.filter(car => {
    const carTier = (car.required_plan || 'basic').toLowerCase()
    return carTier === selectedTier.value
  })
})

const loadData = async () => {
  try {
    // Use cached subscription (NO API CALL)
    const sub = subscription.value
    if (!sub) {
      errorMessage.value = 'No active subscription found'
      isLoading.value = false
      return
    }
    
    // Use current car from subscription
    selectedFromCar.value = sub.car
    
    // Load ALL approved bookings (from cache - NO API CALL)
    const allAvailableCarsToSwapFrom = []
    const cachedBookings = cacheStore.userBookings || []
    const approvedBookings = cachedBookings.filter(b => b.status === 'approved')
    
    // Add all approved bookings to the list
    const bookingCars = approvedBookings.map(booking => ({
      id: booking.id,
      car: booking.car,
      status: 'approved',
      source: 'booking',
      created_at: booking.created_at
    }))
    allAvailableCarsToSwapFrom.push(...bookingCars)
    
    // Load swap history (from cache - NO API CALL)
    const swappedFromCarIds = [] // Track which cars have been swapped FROM
    const cachedSwaps = cacheStore.swapHistory || []
    const approvedSwaps = cachedSwaps.filter(s => s.status === 'approved')
    
    // Collect all from_car_ids that have been swapped FROM (these should be removed)
    approvedSwaps.forEach(swap => {
      if (swap.from_car_id) {
        swappedFromCarIds.push(swap.from_car_id)
      }
    })
    
    // Add ALL approved swap cars (TO cars) to the list
    for (const swap of approvedSwaps) {
      try {
        let swapCar = swap.to_car
        if (!swapCar && swap.to_car_id) {
          const carRes = await carsAPI.getCar(swap.to_car_id)
          swapCar = carRes.data
        }
        
        // Only add if it's not already in our list (avoid duplicates)
        if (swapCar && !allAvailableCarsToSwapFrom.some(item => item.car?.id === swapCar.id)) {
          allAvailableCarsToSwapFrom.push({
            id: `swap_car_${swapCar.id}_${swap.id}`,
            car: swapCar,
            status: 'approved',
            source: 'swap',
            created_at: swap.timestamp
          })
        }
      } catch (e) {
        // Unable to fetch swap car
      }
    }
    
    // Check for pending swap
    const pending = cachedSwaps.find(s => s.status === 'pending')
    if (pending) {
      let pendingToCar = pending.to_car || null
      if (!pendingToCar && pending.to_car_id) {
        const cachedPendingToCar = (cacheStore.cars || []).find(c => c.id === pending.to_car_id)
        if (cachedPendingToCar) pendingToCar = cachedPendingToCar
      }
      pendingSwap.value = { ...pending, to_car: pendingToCar }
    }
    
    // REMOVE bookings that have been swapped FROM - only keep active cars
    const activeCars = allAvailableCarsToSwapFrom.filter(item => 
      !swappedFromCarIds.includes(item.car?.id)
    )
    
    // Sort by creation date (newest first) and display only active cars
    bookings.value = activeCars.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
    
    // Use cached cars (NO API CALL)
    const cachedCars = cacheStore.cars || []
    
    // Define tier hierarchy: each tier can access its own tier and below
    const tierHierarchy = {
      'basic': ['basic'],
      'premium': ['basic', 'premium'],
      'luxury': ['basic', 'premium', 'luxury']
    }
    
    // Get user's plan tier
    const userTier = sub?.plan?.tier || 'basic'
    const allowedTiers = tierHierarchy[userTier] || ['basic']
    
    // Filter cars by: allowed tier + not the currently selected car
    availableCars.value = cachedCars.filter(car => {
      const carTier = (car.required_plan || 'basic').toLowerCase()
      return allowedTiers.includes(carTier) && car.id !== selectedFromCar.value?.id
    })
    
  } catch (error) {
    console.error('Failed to load swap data:', error)
    errorMessage.value = 'Failed to load swap information'
  } finally {
    isLoading.value = false
  }
}

const requestSwap = async () => {
  if (!selectedFromCar.value || !selectedCar.value || isSwapping.value) return

  if (selectedFromCar.value.id === selectedCar.value.id) {
    errorMessage.value = 'Please select a different new car for swap.'
    return
  }
  
  isSwapping.value = true
  errorMessage.value = ''
  
  try {
    await swapAPI.createSwapRequest(
      subscription.value.id,
      selectedFromCar.value.id,
      selectedCar.value.id,
      note.value
    )
    successMessage.value = `Swap request submitted for ${selectedCar.value.brand} ${selectedCar.value.name}! Awaiting admin approval.`
    
    setTimeout(() => {
      router.push('/dashboard')
    }, 2500)
  } catch (error) {
    console.error('Swap request failed:', error)
    errorMessage.value = error.response?.data?.detail || 'Failed to submit swap request. Please try again.'
    isSwapping.value = false
  }
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
.swap-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: var(--cs-navbar-offset);
}

.swap-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.1rem;
}

.no-subscription {
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
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

.no-booking {
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.no-booking-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.no-booking h3 {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.no-booking p {
  color: #666;
  margin-bottom: 20px;
}

.swap-header {
  margin-bottom: 30px;
}

.swap-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}

.swap-header p {
  color: #666;
  margin-bottom: 2rem;
}

/* Step indicators */
.swap-step {
  margin-bottom: 2.5rem;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 100%);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.6rem;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.25rem 0;
}

.step-subtitle {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

/* Booking Cards */
.return-car-selection {
  margin-top: 2rem;
  margin-bottom: 2.5rem;
  background: #fafafa;
  border-radius: 16px;
  padding: 2rem;
}

.booking-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.booking-card {
  background: white;
  border: 3px solid #e8e8e8;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.booking-card:hover {
  border-color: #ff5722;
  box-shadow: 0 8px 24px rgba(255, 87, 34, 0.2);
  transform: translateY(-4px);
}

.booking-card.selected {
  border-color: #ff5722;
  background: linear-gradient(135deg, #fff8f5 0%, #ffe8df 100%);
  box-shadow: 0 8px 32px rgba(255, 87, 34, 0.3);
}

.booking-card.selected::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff5722, #ff9a6b);
}

.car-image-small {
  width: 100%;
  height: 140px;
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.car-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.booking-card:hover .car-image-small img {
  transform: scale(1.05);
}

.car-image-small .placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
}

.car-name-small {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.select-checkmark {
  color: #ff5722;
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 0.75rem;
  animation: checkmark-bounce 0.5s ease;
}

@keyframes checkmark-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Swap Info Bar */
.swap-info-bar {
  background: linear-gradient(135deg, #fff5f1 0%, #ffe8df 100%);
  border: 2px solid #ff5722;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.swap-counter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.swap-counter .label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

.plan-name {
  font-weight: 700;
  color: #ff5722;
  font-size: 1.05rem;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}

.swap-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.swap-status .label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 140px;
}

.swap-status .value {
  font-weight: 700;
  color: #ff5722;
  font-size: 1.15rem;
  min-width: 50px;
}

.swap-status .value.low-limit {
  color: #d32f2f;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.swap-progress {
  flex: 1;
  min-width: 120px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff5722, #ff9a6b);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.limit-warning {
  color: #d32f2f;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1rem;
  background: #ffebee;
  border-radius: 8px;
  border-left: 4px solid #d32f2f;
}

.return-car-selection {
  margin-bottom: 30px;
}

.booking-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.return-car-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
}

.return-car-card:hover {
  border-color: #ff4d30;
  box-shadow: 0 4px 12px rgba(255, 77, 48, 0.1);
}

.return-car-card.selected {
  border-color: #ff4d30;
  background: #fff5f0;
  box-shadow: 0 4px 16px rgba(255, 77, 48, 0.2);
}

.car-image-medium {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.car-image-medium img {
  /* width: 100%; */
  height: 100%;
  object-fit: cover;
}

.car-name-return {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d30;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.current-car-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.car-image-large {
  flex-shrink: 0;
  width: 180px;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.car-image-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.current-label {
  opacity: 0.7;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.current-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.car-name {
  font-size: 1.4rem;
  font-weight: 600;
}

.swap-status {
  text-align: right;
}

.swaps-used {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff4d30;
}

.swaps-label {
  font-size: 0.85rem;
  opacity: 0.7;
}

.limit-warning {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 77, 48, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
}

.car-selection h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.car-swap-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.car-swap-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.car-swap-card.selected {
  border-color: #ff4d30;
}

.car-image {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: #f0f0f0;
}

.car-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.car-image .placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.car-status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
}

.car-status-badge.available {
  color: #2e7d32;
}

.car-status-badge.in-use {
  color: #ff9800;
}

.car-info {
  padding: 16px;
}

.car-info h4 {
  font-size: 1rem;
  margin-bottom: 4px;
  color: #111;
}

.car-info p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.select-indicator {
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
}

.car-swap-card.selected .select-indicator {
  background: #ff4d30;
  color: white;
  font-weight: 600;
}

.swap-note {
  margin-bottom: 24px;
}

.swap-note label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.swap-note textarea {
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.swap-note textarea:focus {
  outline: none;
  border-color: #ff4d30;
}

.confirm-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.new-car-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.selected-car-image {
  flex-shrink: 0;
  width: 160px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #ff4d30;
}

.selected-car-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.swap-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.swap-label {
  color: #888;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.new-car-name {
  color: #111;
  font-size: 1.3rem;
  font-weight: 700;
}

.swap-summary span {
  color: #666;
  margin-right: 8px;
}

.swap-summary strong {
  color: #111;
  font-size: 1.1rem;
}

.confirm-btn {
  min-width: 160px;
  align-self: flex-end;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.alert-danger {
  background: #ffebee;
  color: #c62828;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Pending swap card */
.pending-swap-card {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  border: 2px solid #ffc107;
}

.pending-icon {
  font-size: 2.5rem;
}

.pending-content h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.pending-content p {
  color: #666;
  margin: 0 0 16px 0;
}

.pending-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 500;
}

.pending-details .arrow {
  color: #ff4d30;
  font-size: 1.2rem;
}

.swap-note-info {
  color: #888;
  font-size: 0.85rem;
  margin-top: 16px;
  text-align: center;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
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

@media (max-width: 600px) {
  .current-car-card {
    flex-direction: column;
    text-align: center;
  }

  .booking-cards-grid {
    grid-template-columns: 1fr;
  }

  .return-car-card {
    margin-bottom: 8px;
  }

  .car-image-large {
    width: 150px;
    height: 110px;
    margin: 0 auto 12px;
  }

  .current-info {
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }
  
  .swap-status {
    text-align: center;
  }

  .new-car-display {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .selected-car-image {
    width: 140px;
    height: 100px;
  }
  
  .confirm-section {
    flex-direction: column;
    gap: 16px;
  }

  .confirm-btn {
    width: 100%;
    align-self: stretch;
  }
}

/* Select Car Button Section */
.select-car-button-section {
  text-align: center;
  margin: 40px 0;
}

.select-car-btn {
  padding: 14px 48px;
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 220px;
}

/* Car Selection Header with Filters */
.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.selection-header h2 {
  font-size: 1.5rem;
  margin: 0;
  flex: 1;
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

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

/* Swap Arrow */
.swap-arrow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
  padding: 1rem 0;
}

.swap-arrow {
  font-size: 1.8rem;
  color: #ff5722;
  font-weight: bold;
  animation: bounce 2s infinite;
}

.arrow-label {
  font-size: 0.85rem;
  color: #ff5722;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(8px);
  }
}

.no-cars-message {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .swap-step {
    padding: 1.5rem;
  }
  
  .step-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .selection-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filter-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .cars-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
