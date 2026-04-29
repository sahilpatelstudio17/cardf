<template>
  <div class="subscription-page">
    <Navbar @logout="logout" />
    
    <!-- Existing Subscription Alert -->
    <div v-if="showExistingSubscriptionAlert" class="subscription-alert-overlay">
      <div class="subscription-alert-box">
        <!-- <button @click="showExistingSubscriptionAlert = false" class="alert-close-btn">✕</button> -->
        <div class="alert-icon">✓</div>
        <h3>Active Subscription Found</h3>
        <p>{{ existingSubscriptionMessage }}</p>
        <p class="alert-subtitle">What would you like to do?</p>
        <div class="alert-buttons">
          <button @click="handleDashboardClick" class="btn-primary">
            Go to Dashboard
          </button>
          <button @click="handleSwapClick" class="btn-secondary">
            Go to Swap Car
          </button>
        </div>
        <!-- <button @click="showExistingSubscriptionAlert = false" class="btn-close-alert">
          Close
        </button> -->
      </div>
    </div>
    
    <div class="subscription-container">
      <div class="page-header">
        <h1>Complete Your Subscription</h1>
        <p>Fill in your details and select a plan to get started</p>
      </div>

      <!-- Select Car Section - Full Width -->
      <div ref="carSelectionSection" v-if="selectedPlan" class="car-selection-section">
        <div class="car-selection-header">
          <div class="header-content">
            <div>
              <h2>Select Your Car</h2>
              <p>Choose up to {{ maxSelectableCars }} car{{ maxSelectableCars > 1 ? 's' : '' }} for your {{ selectedPlan.name }} plan</p>
            </div>
            <div class="filter-buttons">
              <button 
                v-for="tier in ['Basic', 'Premium', 'Luxury']"
                :key="tier"
                class="filter-btn"
                :class="{ active: filterTier === tier.toLowerCase() }"
                @click="filterTier = filterTier === tier.toLowerCase() ? null : tier.toLowerCase()"
              >
                {{ tier }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="filteredCars.length === 0" class="no-cars-message">
          <small class="form-text text-danger">
            No cars available for this plan
          </small>
        </div>
        
        <div v-else class="car-grid-container-full">
          <div 
            v-for="car in filteredCars" 
            :key="car.id"
            class="car-card"
            :class="{ selected: isCarSelected(car) }"
            @click="selectCarAndScroll(car)"
          >
            <div class="car-image">
              <img 
                :src="getCarImage(car)" 
                loading="lazy"
                :alt="car.name"
                class="img-fluid"
              />
              <!-- Tier Badge -->
              <div class="car-tier-badge" :class="`tier-${(car.required_plan || 'basic').toLowerCase()}`">
                {{ (car.required_plan || 'basic').toUpperCase() }}
              </div>
              <!-- Category Badge -->
              <div class="car-category-badge">
                {{ car.category || 'Sedan' }}
              </div>
            </div>
            <div class="car-info">
              <div class="car-name">{{ car.brand }} {{ car.name }}</div>
              <div class="car-category">{{ car.category || 'Sedan' }}</div>
            </div>
            <div class="select-btn">
              {{ isCarSelected(car) ? '✓ Selected' : 'Select' }}
            </div>
          </div>
        </div>
        <small class="selection-count">
          Selected {{ selectedCars.length }} / {{ maxSelectableCars }}
        </small>
      </div>

      <div class="payment-form-wrapper">
        <!-- Left Section: Your Information -->
        <div class="form-section">
          <h2>Your Information</h2>
          
          <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="submitForm">
            <!-- Full Name -->
            <div class="form-group">
              <label for="fullname">Full Name</label>
              <input 
                v-model="formData.fullname"
                type="text"
                id="fullname"
                class="form-control"
                placeholder="John Doe"
                @input="handleFullnameInput"
                required
              />
              <small v-if="errors.fullname" class="error-text">{{ errors.fullname }}</small>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                v-model="formData.email"
                type="text"
                id="email"
                class="form-control"
                placeholder="john@example.com"
                @input="validateFieldEmail"
                required
              />
              <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
            </div>

            <!-- License Number -->
            <div class="form-group">
              <label for="licenseNumber">License Number</label>
              <input 
                v-model="formData.licenseNumber"
                type="text"
                id="licenseNumber"
                class="form-control"
                placeholder="DL1234567890"
                @input="handleLicenseInput"
                required
              />
              <small v-if="errors.licenseNumber" class="error-text">{{ errors.licenseNumber }}</small>
            </div>

            <!-- License Expiry Date -->
            <div class="form-group">
              <label for="licenseExpiry">License Expiry Date</label>
              <input 
                v-model="formData.licenseExpiry"
                type="date"
                id="licenseExpiry"
                class="form-control"
                @input="validateFieldLicenseExpiry"
                required
              />
              <small v-if="errors.licenseExpiry" class="error-text">{{ errors.licenseExpiry }}</small>
            </div>

            <!-- Phone Number -->
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                v-model="formData.phone"
                type="text"
                id="phone"
                class="form-control"
                placeholder="+91 9876543210"
                @input="handlePhoneInput"
                inputmode="numeric"
                required
              />
              <small v-if="errors.phone" class="error-text">{{ errors.phone }}</small>
            </div>

            <!-- Driver Service -->
            <div class="driver-service-block">
              <div class="driver-service-header">
                <div>
                  <label>Driver Service</label>
                  <p>Open the driver service form to add pickup and driver details.</p>
                </div>
                <button
                  type="button"
                  class="btn btn-secondary driver-service-btn"
                  @click="openDriverServiceForm"
                  :disabled="!driverServiceAllowed"
                >
                  {{ formData.driverService ? 'Edit Driver Service' : 'Add Driver Service' }}
                </button>
                <small v-if="!driverServiceAllowed && selectedPlan" class="text-danger" style="margin-left:12px">Driver service is available only on Pro plans</small>
              </div>

              <div v-if="formData.driverService" class="driver-service-summary">
                <div class="driver-service-summary-title">Driver Service Details Saved</div>
                <div class="driver-service-summary-grid">
                  <div>
                    <span class="summary-label">Customer</span>
                    <strong>{{ formData.driverService.customerName }}</strong>
                  </div>
                  <div>
                    <span class="summary-label">Pickup Location</span>
                    <strong>{{ formData.driverService.pickupLocation }}</strong>
                  </div>
                  <div>
                    <span class="summary-label">Date &amp; Time</span>
                    <strong>{{ formatDriverDateTime(formData.driverService.serviceDateTime) }}</strong>
                  </div>
                  <div>
                    <span class="summary-label">Driver</span>
                    <strong>{{ formData.driverService.selectedDriver?.name || 'N/A' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Select Plan -->
            <div class="form-group">
              <label for="plan">Select Plan</label>
              <select 
                v-model="selectedPlan"
                id="plan"
                class="form-control"
                @change="onPlanChange"
                required
              >
                <option value="">Choose a plan...</option>
                <option 
                  v-for="plan in plans" 
                  :key="plan.id"
                  :value="plan"
                >
                  {{ plan.name }} - ₹{{ plan.price }}/month
                </option>
              </select>
            </div>

            <!-- Terms -->
            <div class="form-group checkbox">
              <input 
                v-model="agreedToTerms"
                type="checkbox"
                id="terms"
              />
              <label for="terms">
                I agree to the terms and conditions
              </label>
            </div>

            <!-- Submit Button -->
            <button 
              ref="submitButton"
              type="submit"
              class="btn btn-primary btn-block"
              :disabled="isProcessing || !agreedToTerms || !selectedPlan || selectedCars.length === 0"
            >
              {{ isProcessing ? 'Processing...' : 'Proceed to Payment' }}
            </button>
          </form>
        </div>

        <!-- Right Section: Plan Summary -->
        <div class="summary-section">
          <h2>Summary</h2>
          
          <div v-if="selectedPlan" class="plan-summary">
            <div class="summary-title">{{ selectedPlan.name }} Plan</div>
            
            <div class="summary-item">
              <span class="label">Price:</span>
              <span class="value">₹{{ selectedPlan.price }}/month</span>
            </div>
            
            <div class="summary-item">
              <span class="label">Duration:</span>
              <span class="value">₹{{ selectedPlan.duration_months }} month(s)</span>
            </div>
            
            <div class="summary-item">
              <span class="label">Car Swaps:</span>
              <span class="value">{{ selectedPlan.swap_limit }}</span>
            </div>

            <div class="summary-item">
              <span class="label">Max Bookings:</span>
              <span class="value">{{ selectedPlan.max_active_bookings || 1 }}</span>
            </div>

            <div class="summary-item">
              <span class="label">Driver Service:</span>
              <span class="value">{{ formData.driverService ? 'Added' : 'Not Added' }}</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-item total">
              <span class="label">Total Amount:</span>
              <span class="price">₹{{ selectedPlan.price }}</span>
            </div>
          </div>

          <div v-if="selectedCars.length > 0" class="car-summary">
            <div class="summary-title">Selected Cars ({{ selectedCars.length }})</div>
            <div v-for="car in selectedCars" :key="car.id" class="selected-car-item">
              <div class="car-image-wrapper mini">
                <img :src="getCarImage(car)" loading="lazy" :alt="car.name" />
              </div>
              <div class="car-details left">
                <div class="car-name">{{ car.brand }} {{ car.name }}</div>
                <div class="car-category">{{ car.category || 'Sedan' }}</div>
              </div>
            </div>
          </div>

          <div v-if="!selectedPlan" class="no-selection">
            <p>Select a plan to get started</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Driver Service Form Modal -->
    <div v-if="showDriverServiceModal" class="driver-modal-overlay">
      <div class="driver-modal">
        <div class="driver-modal-header">
          <div>
            <h3>Driver Service Details</h3>
            <p>Select a driver and fill the pickup information.</p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeDriverServiceForm">✕</button>
        </div>

        <form class="driver-modal-form" @submit.prevent="confirmDriverService">
          <div class="form-group">
            <label for="customerName">Customer Name</label>
            <input
              v-model="driverServiceDraft.customerName"
              id="customerName"
              type="text"
              class="form-control"
              placeholder="Customer name"
              required
            />
          </div>

          <div class="form-group">
            <label for="pickupLocation">Pickup Location</label>
            <input
              v-model="pickupSearchQuery"
              id="pickupLocation"
              type="text"
              class="form-control"
              placeholder="Type location name (e.g. Vahelal, Ahmedabad)"
              list="pickup-location-options"
              autocomplete="off"
              @input="handlePickupLocationSearch"
              @change="handlePickupLocationSelect"
              required
            />

            <datalist id="pickup-location-options">
              <option
                v-for="location in pickupSuggestions"
                :key="location.id"
                :value="location.address"
              >
                {{ location.name }}
              </option>
            </datalist>

            <div v-if="isSearchingPickup" class="pickup-searching">
              Searching locations...
            </div>

            <div class="pickup-map-preview">
              <iframe
                :src="pickupMapUrl"
                width="100%"
                height="150"
                style="border: 0; border-radius: 12px;"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
              <div class="map-openinmaps-mask" aria-hidden="true"></div>
            </div>
          </div>

          <div class="form-group">
            <label for="serviceDate">Date</label>
            <input
              v-model="driverServiceDraft.serviceDate"
              id="serviceDate"
              type="date"
              class="form-control"
              :min="driverServiceMinDate"
              @change="handleDriverServiceDateChange"
              required
            />

            <label for="serviceTime" style="margin-top: 0.75rem;">Time</label>
            <select
              v-model="driverServiceDraft.serviceTime"
              id="serviceTime"
              class="form-control"
              :disabled="!driverServiceDraft.serviceDate"
              required
            >
              <option value="">Select time...</option>
              <option v-for="time in availableServiceTimes" :key="time" :value="time">
                {{ time }}
              </option>
            </select>
            <small v-if="driverServiceErrors.serviceDateTime" class="error-text">
              {{ driverServiceErrors.serviceDateTime }}
            </small>
          </div>

          <div class="driver-section-label">
            Available Drivers
          </div>
          <div class="driver-cards">
            <button
              v-for="driver in availableDrivers"
              :key="driver.id"
              type="button"
              class="driver-card"
              :class="{ selected: driverServiceDraft.selectedDriver?.id === driver.id }"
              @click="driverServiceDraft.selectedDriver = driver"
            >
              <div class="driver-card-top">
                <strong>{{ driver.name }}</strong>
                <span>{{ driver.rating }}</span>
              </div>
              <p>{{ driver.experience }} experience</p>
              <small>{{ driver.shift }}</small>
            </button>
          </div>

          <div class="driver-modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeDriverServiceForm">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!driverServiceDraft.selectedDriver">
              Confirm Driver Service
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { subscriptionAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import { useUser } from '../composables/useUser'
import { validateFullname, validateEmail, validatePhoneNumber, validateLicenseNumber, validateLicenseExpiry } from '../utils/validators'

const router = useRouter()
const cacheStore = useCacheStore()

const selectedPlan = ref(null)
const selectedCars = ref([])
const isProcessing = ref(false)
const errorMessage = ref('')
const agreedToTerms = ref(false)
const submitButton = ref(null)
const carSelectionSection = ref(null)
const filterTier = ref(null)
const showExistingSubscriptionAlert = ref(false)
const existingSubscriptionMessage = ref('')

// Use plans and cars from Pinia cache store (no API calls)
const plans = computed(() => cacheStore.subscriptionPlans)
const cars = computed(() => cacheStore.cars)

const formData = ref({
  fullname: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  phone: '',
  driverService: null
})

const showDriverServiceModal = ref(false)
const driverServiceDraft = ref({
  customerName: '',
  pickupLocation: '',
  serviceDateTime: '',
  serviceDate: '',
  serviceTime: '',
  selectedDriver: null,
  selectedPickupLocation: null
})

const pickupSearchQuery = ref('')
const pickupSuggestions = ref([])
const isSearchingPickup = ref(false)
let pickupSearchTimer = null
const driverServiceErrors = ref({
  serviceDateTime: ''
})

const availableDrivers = [
  { id: 1, name: 'Arjun Mehta', experience: '6 years', rating: '4.9/5', shift: 'Morning shift' },
  { id: 2, name: 'Rahul Singh', experience: '4 years', rating: '4.8/5', shift: 'Afternoon shift' },
  { id: 3, name: 'Imran Khan', experience: '8 years', rating: '5.0/5', shift: 'Night shift' }
]

// Error message refs for each field
const errors = ref({
  fullname: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  phone: ''
})

const formatDriverDateTime = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const padTwo = (value) => String(value).padStart(2, '0')

const driverServiceMinDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`
})

const parseLocalDate = (value) => {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if ([year, month, day].some(Number.isNaN)) return null

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const parseLocalDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null

  const datePart = parseLocalDate(dateValue)
  if (!datePart) return null

  const [hour, minute] = timeValue.split(':').map(Number)
  if ([hour, minute].some(Number.isNaN)) return null

  return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hour, minute, 0, 0)
}

const availableServiceTimes = computed(() => {
  const selectedDate = parseLocalDate(driverServiceDraft.value.serviceDate)
  if (!selectedDate) return []

  const now = new Date()
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate()

  const startMinutes = isToday
    ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30
    : 0

  const slots = []
  for (let minutes = startMinutes; minutes < 24 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    slots.push(`${padTwo(hour)}:${padTwo(minute)}`)
  }

  return slots
})

const validateDriverServiceDateTime = () => {
  driverServiceErrors.value.serviceDateTime = ''

  const selectedDateTime = parseLocalDateTime(
    driverServiceDraft.value.serviceDate,
    driverServiceDraft.value.serviceTime
  )
  if (!selectedDateTime) {
    driverServiceErrors.value.serviceDateTime = 'Please select a valid date and time'
    return false
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const selectedStart = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate())

  if (selectedStart < todayStart) {
    driverServiceErrors.value.serviceDateTime = 'Past dates are not allowed'
    return false
  }

  if (selectedStart.getTime() === todayStart.getTime() && selectedDateTime <= now) {
    driverServiceErrors.value.serviceDateTime = 'For today, choose a future time'
    return false
  }

  return true
}

const showNoPickupResults = computed(() => {
  return pickupSearchQuery.value.trim().length >= 2 && !isSearchingPickup.value && pickupSuggestions.value.length === 0
})

const pickupMapUrl = computed(() => {
  const selected = driverServiceDraft.value.selectedPickupLocation

  if (selected?.lat && selected?.lng) {
    return `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=15&output=embed`
  }

  const typedQuery = pickupSearchQuery.value.trim()
  if (typedQuery) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(typedQuery)}&z=13&output=embed`
  }

  return 'https://maps.google.com/maps?q=Ahmedabad&z=12&output=embed'
})

const placeholder = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop'

const getCarImage = (car) => {
  if (car?.image) {
    if (car.image.startsWith('http')) return car.image
    return `https://cardb-1.onrender.com${car.image}`
  }
  return placeholder
}

// Plan tier hierarchy
const tierAccess = {
  'basic': ['basic'],
  'premium': ['basic', 'premium'],
  'luxury': ['basic', 'premium', 'luxury']
}

// Filter cars based on selected plan tier and user filter
const filteredCars = computed(() => {
  if (!selectedPlan.value) return cars.value
  
  const planTier = selectedPlan.value.tier || 'basic'
  const allowedTiers = tierAccess[planTier] || ['basic']
  
  let filtered = cars.value.filter(car => {
    const carRequiredPlan = car.required_plan || 'basic'
    return allowedTiers.includes(carRequiredPlan) && car.available
  })
  
  // Apply manual filter if one is selected
  if (filterTier.value) {
    filtered = filtered.filter(car => {
      const carTier = car.required_plan || 'basic'
      return carTier === filterTier.value
    })
  }
  
  return filtered
})

const maxSelectableCars = computed(() => {
  if (!selectedPlan.value) return 0
  return selectedPlan.value.max_active_bookings || 1
})

// Driver service availability: only available on 'pro' plans (plan name contains 'pro' or tier === 'pro')
const driverServiceAllowed = computed(() => {
  const plan = selectedPlan.value
  if (!plan) return false
  const name = (plan.name || '').toLowerCase()
  const tier = (plan.tier || '').toLowerCase()
  return name.includes('pro') || tier === 'pro' || plan.is_pro === true
})

const isCarSelected = (car) => selectedCars.value.some(item => item.id === car.id)

// Input sanitization handlers
const handleFullnameInput = (event) => {
  let value = event.target.value
  // Remove numbers and special characters, keep only letters and spaces
  value = value.replace(/[0-9!@#$%^&*()_+=\[\]{};:'"`<>,.?/|`~-]/g, '')
  formData.value.fullname = value
  validateFieldFullname()
}

const handlePhoneInput = (event) => {
  let value = event.target.value
  // Only allow digits, +, spaces, and hyphens
  value = value.replace(/[^0-9+\s\-]/g, '')
  // Limit to reasonable length
  if (value.length > 20) {
    value = value.substring(0, 20)
  }
  formData.value.phone = value
  validateFieldPhone()
}

const handleLicenseInput = (event) => {
  let value = event.target.value.toUpperCase()
  // Only allow letters and numbers
  value = value.replace(/[^A-Z0-9\s\-]/g, '')
  formData.value.licenseNumber = value
  validateFieldLicenseNumber()
}

// Field validation handlers
const validateFieldFullname = () => {
  const validation = validateFullname(formData.value.fullname)
  errors.value.fullname = validation.isValid ? '' : validation.message
}

const validateFieldEmail = () => {
  const validation = validateEmail(formData.value.email)
  errors.value.email = validation.isValid ? '' : validation.message
}

const validateFieldPhone = () => {
  const validation = validatePhoneNumber(formData.value.phone)
  errors.value.phone = validation.isValid ? '' : validation.message
}

const validateFieldLicenseNumber = () => {
  const validation = validateLicenseNumber(formData.value.licenseNumber)
  errors.value.licenseNumber = validation.isValid ? '' : validation.message
}

const validateFieldLicenseExpiry = () => {
  const validation = validateLicenseExpiry(formData.value.licenseExpiry)
  errors.value.licenseExpiry = validation.isValid ? '' : validation.message
}

const openDriverServiceForm = () => {
  if (!driverServiceAllowed.value) {
    errorMessage.value = 'Driver service is available only on Pro plans'
    return
  }
  if (formData.value.driverService) {
    driverServiceDraft.value = {
      ...formData.value.driverService,
      selectedDriver: formData.value.driverService.selectedDriver || null,
      selectedPickupLocation: formData.value.driverService.selectedPickupLocation || null,
      serviceDate: formData.value.driverService.serviceDate || '',
      serviceTime: formData.value.driverService.serviceTime || ''
    }
    pickupSearchQuery.value = formData.value.driverService.selectedPickupLocation?.name || formData.value.driverService.pickupLocation || ''
    pickupSuggestions.value = driverServiceDraft.value.selectedPickupLocation ? [driverServiceDraft.value.selectedPickupLocation] : []
  } else {
    driverServiceDraft.value = {
      customerName: formData.value.fullname || '',
      pickupLocation: '',
      serviceDateTime: '',
      serviceDate: '',
      serviceTime: '',
      selectedDriver: null,
      selectedPickupLocation: null
    }
    pickupSearchQuery.value = ''
    pickupSuggestions.value = []
  }
  showDriverServiceModal.value = true
}

const closeDriverServiceForm = () => {
  showDriverServiceModal.value = false
  driverServiceErrors.value.serviceDateTime = ''
}

const handleDriverServiceDateChange = () => {
  driverServiceDraft.value.serviceTime = ''
  driverServiceDraft.value.serviceDateTime = ''
  driverServiceErrors.value.serviceDateTime = ''
}

const handlePickupLocationSearch = () => {
  const query = pickupSearchQuery.value.trim()

  if (pickupSearchTimer) {
    clearTimeout(pickupSearchTimer)
  }

  if (query.length < 2) {
    pickupSuggestions.value = []
    driverServiceDraft.value.selectedPickupLocation = null
    driverServiceDraft.value.pickupLocation = ''
    return
  }

  driverServiceDraft.value.selectedPickupLocation = null
  driverServiceDraft.value.pickupLocation = query

  pickupSearchTimer = setTimeout(async () => {
    isSearchingPickup.value = true
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in&q=${encodeURIComponent(query)}`
      const response = await fetch(endpoint)
      const results = await response.json()

      pickupSuggestions.value = (results || []).map((item) => {
        const displayName = item.display_name || ''
        const name = (displayName.split(',')[0] || displayName).trim()
        return {
          id: item.place_id,
          name,
          address: displayName,
          lat: Number(item.lat),
          lng: Number(item.lon)
        }
      })
    } catch (error) {
      pickupSuggestions.value = []
    } finally {
      isSearchingPickup.value = false
    }
  }, 350)
}

const handlePickupLocationSelect = () => {
  const query = pickupSearchQuery.value.trim().toLowerCase()
  if (!query) return

  const match = pickupSuggestions.value.find((location) => {
    return location.address.toLowerCase() === query || location.name.toLowerCase() === query
  })

  if (match) {
    selectPickupLocation(match)
  }
}

const selectPickupLocation = (location) => {
  driverServiceDraft.value.selectedPickupLocation = location
  driverServiceDraft.value.pickupLocation = location.address
  pickupSearchQuery.value = location.address
  pickupSuggestions.value = [location]
}

const confirmDriverService = () => {
  if (!driverServiceDraft.value.selectedDriver) {
    errorMessage.value = 'Please select a driver before confirming'
    return
  }

  if (!driverServiceDraft.value.selectedPickupLocation) {
    errorMessage.value = 'Please select a pickup location before confirming'
    return
  }

  if (!validateDriverServiceDateTime()) {
    return
  }

  formData.value.driverService = {
    customerName: driverServiceDraft.value.customerName.trim(),
    pickupLocation: driverServiceDraft.value.selectedPickupLocation.address,
    selectedPickupLocation: driverServiceDraft.value.selectedPickupLocation,
    serviceDate: driverServiceDraft.value.serviceDate,
    serviceTime: driverServiceDraft.value.serviceTime,
    serviceDateTime: `${driverServiceDraft.value.serviceDate}T${driverServiceDraft.value.serviceTime}`,
    selectedDriver: driverServiceDraft.value.selectedDriver
  }

  showDriverServiceModal.value = false
}

const validateForm = () => {
  // Clear previous errors
  errorMessage.value = ''
  
  // Validate all fields
  const fullnameValidation = validateFullname(formData.value.fullname)
  const emailValidation = validateEmail(formData.value.email)
  const phoneValidation = validatePhoneNumber(formData.value.phone)
  const licenseValidation = validateLicenseNumber(formData.value.licenseNumber)
  const expiryValidation = validateLicenseExpiry(formData.value.licenseExpiry)

  // Set errors
  errors.value.fullname = fullnameValidation.isValid ? '' : fullnameValidation.message
  errors.value.email = emailValidation.isValid ? '' : emailValidation.message
  errors.value.phone = phoneValidation.isValid ? '' : phoneValidation.message
  errors.value.licenseNumber = licenseValidation.isValid ? '' : licenseValidation.message
  errors.value.licenseExpiry = expiryValidation.isValid ? '' : expiryValidation.message

  // Check if all validations passed
  if (!fullnameValidation.isValid || !emailValidation.isValid || !phoneValidation.isValid || 
      !licenseValidation.isValid || !expiryValidation.isValid) {
    return false
  }

  return true
}

const submitForm = async () => {
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  if (!selectedPlan.value || selectedCars.value.length === 0) {
    errorMessage.value = 'Please select a plan and at least one car'
    return
  }

  if (selectedCars.value.length > maxSelectableCars.value) {
    errorMessage.value = `You can select up to ${maxSelectableCars.value} car${maxSelectableCars.value > 1 ? 's' : ''} for this plan`
    return
  }

  isProcessing.value = true

  try {
    // Save selected plan/car and form details for Payment page (final submission step).
    localStorage.setItem('selectedPlanForPayment', JSON.stringify(selectedPlan.value))
    localStorage.setItem('selectedCarsForPayment', JSON.stringify(selectedCars.value))
    localStorage.setItem('paymentFormDraft', JSON.stringify(formData.value))

    // Set flag to allow access to payment page
    sessionStorage.setItem('subscriptionCompleted', 'true')

    router.push('/payment')
  } catch (error) {
    console.error('Failed to proceed to payment:', error)
    errorMessage.value = 'Failed to proceed to payment. Please try again.'
  } finally {
    isProcessing.value = false
  }
}

const loadPlans = async () => {
  // Plans are already in cache from App.vue - NO API CALL HERE
  // Just update local state from Pinia store
}

const loadCars = async () => {
  // Cars are already in cache from App.vue - NO API CALL HERE
  // Just update local state from Pinia store
}

const selectCarAndScroll = (car) => {
  const selectedIndex = selectedCars.value.findIndex(item => item.id === car.id)

  if (selectedIndex >= 0) {
    selectedCars.value.splice(selectedIndex, 1)
  } else {
    if (selectedCars.value.length >= maxSelectableCars.value) {
      errorMessage.value = `You can select up to ${maxSelectableCars.value} car${maxSelectableCars.value > 1 ? 's' : ''} for this plan`
      return
    }
    selectedCars.value.push(car)
  }

  errorMessage.value = ''
  // Scroll to submit button after car selection
  setTimeout(() => {
    if (submitButton.value) {
      submitButton.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

const onPlanChange = () => {
  errorMessage.value = ''
  filterTier.value = null  // Reset filter when plan changes
  const filteredIds = new Set(filteredCars.value.map(car => car.id))
  selectedCars.value = selectedCars.value.filter(car => filteredIds.has(car.id)).slice(0, maxSelectableCars.value)
  scrollToCars()
}

const scrollToCars = () => {
  // Scroll to car selection section when plan is selected
  setTimeout(() => {
    if (carSelectionSection.value) {
      carSelectionSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

const handleDashboardClick = () => {
  showExistingSubscriptionAlert.value = false
  router.push('/dashboard')
}

const handleSwapClick = () => {
  showExistingSubscriptionAlert.value = false
  router.push('/swap')
}

const logout = () => {
  const { clearUser } = useUser()
  // Clear subscription flow flag on logout
  sessionStorage.removeItem('subscriptionCompleted')
  clearUser()
  router.push('/login')
}

onMounted(async () => {
  // Check if user already has an active subscription
  try {
    const response = await subscriptionAPI.getUserSubscription()
    if (response.data && response.data.active && response.data.car) {
      // User has active subscription, show alert
      showExistingSubscriptionAlert.value = true
      existingSubscriptionMessage.value = `You already have an active ${response.data.plan?.name || 'subscription'} subscription with ${response.data.car.brand} ${response.data.car.name}.`
      return
    }
  } catch (error) {
    // No subscription found, continue normally
  }

  await Promise.all([loadPlans(), loadCars()])

  // Fetch and auto-fill current user data from backend
  try {
    const { currentUser, fetchCurrentUser } = useUser()
    if (!currentUser.value) {
      await fetchCurrentUser()
    }
    if (currentUser.value) {
      const user = currentUser.value
      formData.value.email = user.email || ''
      formData.value.fullname = user.full_name || ''
      formData.value.phone = user.phone || ''
      formData.value.licenseNumber = user.license_number || ''
      
      // Format license expiry date if it exists
      if (user.license_expiry) {
        formData.value.licenseExpiry = user.license_expiry.split('T')[0] || ''
      }
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
  }

  // Auto-select plan and car when user clicks car from Cars page
  try {
    const savedCar = localStorage.getItem('selectedCarForSubscription')
    if (savedCar) {
      const preSelectedCar = JSON.parse(savedCar)
      
      // Add car to selection
      selectedCars.value = [preSelectedCar]
      
      // Auto-select matching plan based on car's tier
      const carRequiredPlan = (preSelectedCar.required_plan || 'basic').toLowerCase()
      
      // Find plan with matching tier (exact match)
      const matchingPlan = plans.value.find(plan => 
        (plan.tier || '').toLowerCase() === carRequiredPlan
      )
      
      if (matchingPlan) {
        // Auto-select the plan
        selectedPlan.value = matchingPlan
        
        // Ensure car count doesn't exceed plan limit
        const maxCars = matchingPlan.max_active_bookings || 1
        if (selectedCars.value.length > maxCars) {
          selectedCars.value = selectedCars.value.slice(0, maxCars)
        }
        
        console.log(`✓ Auto-selected ${matchingPlan.name} plan for ${preSelectedCar.brand} ${preSelectedCar.name}`)
        
        // Scroll to car selection section after a brief delay to let DOM update
        setTimeout(() => {
          if (carSelectionSection.value) {
            carSelectionSection.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      } else {
        console.warn(`No matching plan found for tier: ${carRequiredPlan}`)
      }
      
      // Clean up localStorage
      localStorage.removeItem('selectedCarForSubscription')
    }
  } catch (error) {
    console.error('Failed to auto-select car and plan:', error)
  }
})
</script>

<style scoped>
.subscription-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: var(--cs-navbar-offset);
  padding-bottom: 40px;
}

.subscription-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
}

.payment-form-wrapper {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2rem;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-section h2,
.summary-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a2e;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
}

.form-control:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

.text-danger {
  color: #dc3545;
}

.error-text {
  color: #dc3545;
  display: block;
  margin-top: 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-group.checkbox {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.form-group.checkbox input {
  margin-right: 0.75rem;
  margin-top: 0.25rem;
  cursor: pointer;
}

.form-group.checkbox label {
  margin-bottom: 0;
  font-weight: 400;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 87, 34, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

/* Summary Section */
.summary-section {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.plan-summary {
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.summary-item .label {
  opacity: 0.9;
  font-weight: 500;
}

.summary-item .value {
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin: 1rem 0;
}

.summary-item.total {
  font-size: 1.1rem;
  margin-top: 1rem;
}

.summary-item.total .price {
  font-size: 1.3rem;
  font-weight: 700;
}

.car-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
}

.car-image-wrapper {
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
  min-height: 150px;
  margin-bottom: 1rem;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.car-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.car-details {
  text-align: center;
}

.car-details.left {
  text-align: left;
}

.car-name {
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.car-category {
  font-size: 0.9rem;
  color: #666;
}

.no-selection {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  color: #999;
  border: 2px dashed #ddd;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.selected-car-info {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #e8f5e9;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2e7d32;
}

.text-success {
  color: #2e7d32;
}

.driver-service-block {
  margin-bottom: 1.5rem;
  padding: 1rem 1.1rem;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: #fafafa;
}

.driver-service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.driver-service-header label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.driver-service-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.driver-service-btn {
  white-space: nowrap;
}

.driver-service-summary {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 10px;
  background: white;
  border: 1px solid #e8e8e8;
}

.driver-service-summary-title {
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.75rem;
}

.driver-service-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.summary-label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #777;
  margin-bottom: 0.25rem;
}

.driver-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(16, 24, 40, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}

.driver-modal {
  width: min(720px, 100%);
  background: white;
  border-radius: 20px;
  padding: 1rem 1.1rem;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.driver-modal::-webkit-scrollbar {
  display: none;
}

.driver-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.driver-modal-header h3 {
  margin: 0 0 0.35rem 0;
  font-size: 1.25rem;
  color: #1a1a2e;
}

.driver-modal-header p {
  margin: 0;
  color: #666;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #f2f2f2;
  color: #444;
  cursor: pointer;
}

.driver-modal-form {
  display: grid;
  gap: 0.75rem;
}

.driver-section-label {
  margin-top: 0.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.driver-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.driver-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fafafa;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.driver-card:hover {
  transform: translateY(-1px);
  border-color: #ff5722;
}

.driver-card.selected {
  border-color: #ff5722;
  background: #fff4ef;
  box-shadow: 0 10px 22px rgba(255, 87, 34, 0.12);
}

.driver-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.driver-card p,
.driver-card small {
  display: block;
  margin: 0;
  color: #666;
}

.pickup-searching {
  margin-top: 0.65rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: #f5f5f5;
  color: #666;
  font-size: 0.9rem;
}

.pickup-location-suggestions {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.pickup-location-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pickup-location-card:hover {
  border-color: #ff5722;
}

.pickup-location-card.selected {
  border-color: #ff5722;
  background: #fff4ef;
}

.pickup-location-card strong {
  display: block;
  margin-bottom: 0.2rem;
}

.pickup-location-card span {
  color: #666;
  font-size: 0.86rem;
}

.pickup-no-results {
  margin-top: 0.65rem;
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  background: #f8f8f8;
  border: 1px dashed #ddd;
  color: #777;
  font-size: 0.9rem;
}

.pickup-map-preview {
  margin-top: 0.6rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  position: relative;
}

.map-openinmaps-mask {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 180px;
  height: 46px;
  background: #f5f6fa;
  border-radius: 10px;
  pointer-events: none;
}

.driver-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.1rem;
}

/* Car Selection Section - Full Width */
.car-selection-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.car-selection-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.car-selection-header .header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  width: 100%;
}

.car-selection-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.car-selection-header p {
  color: #666;
  font-size: 0.95rem;
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

/* Car Grid Container - Full Width */
.car-grid-container-full {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
  margin-top: 1.5rem;
}

/* Car Grid Container */
.car-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.car-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.car-card:hover {
  box-shadow: 0 6px 14px rgba(0,0,0,0.10);
  transform: translateY(-1px);
}

.car-card.selected {
  border-color: #ff4d30;
  background: #fff9f7;
}

.car-image {
  width: 100%;
  height: 110px;
  overflow: hidden;
  background: #f0f0f0;
  position: relative;
}

.car-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Tier Badge - Top Right */
/* Styles moved to global main.css */

/* Category Badge - Bottom Left */
/* Styles moved to global main.css */

.car-info {
  padding: 10px;
  flex: 1;
}

.car-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.car-category {
  font-size: 0.82rem;
  color: #888;
  margin-bottom: 0;
}

.select-btn {
  padding: 9px;
  text-align: center;
  background: #fafafa;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.car-card.selected .select-btn {
  background: #ff4d30;
  color: white;
}

.no-cars-message {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.selection-count {
  display: block;
  margin-top: 10px;
  color: #666;
  font-size: 0.9rem;
}

.selected-car-item {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.car-image-wrapper.mini {
  min-height: 60px;
  max-height: 60px;
  width: 90px;
  flex-shrink: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .payment-form-wrapper {
    grid-template-columns: 1fr;
  }

  .summary-section {
    position: static;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .subscription-container {
    padding: 1rem;
  }

  .car-selection-header {
    flex-direction: column;
    gap: 1rem;
  }

  .car-selection-header .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .driver-service-header,
  .driver-modal-header {
    flex-direction: column;
    align-items: stretch;
  }

  .driver-service-summary-grid,
  .driver-cards,
  .pickup-location-suggestions {
    grid-template-columns: 1fr;
  }

  .driver-modal-actions {
    flex-direction: column;
  }

  .driver-modal {
    max-height: calc(100vh - 1rem);
  }

  .filter-buttons {
    justify-content: flex-start;
  }
}

/* Existing Subscription Alert Styles */
.subscription-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.subscription-alert-box {
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  position: relative;
}

.alert-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.alert-close-btn:hover {
  background: #ff4d30;
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-icon {
  width: 60px;
  height: 60px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin: 0 auto 20px;
}

.subscription-alert-box h3 {
  color: #333;
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.subscription-alert-box p {
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.alert-subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-top: 16px !important;
}

.alert-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #ff4d30;
  color: white;
}

.btn-primary:hover {
  background: #e63d20;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 48, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  background: #e8e8e8;
  border-color: #ff4d30;
  color: #ff4d30;
}

.btn-close-alert {
  width: 100%;
  padding: 10px 24px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.btn-close-alert:hover {
  background: #f9f9f9;
  border-color: #999;
  color: #333;
}

</style>
