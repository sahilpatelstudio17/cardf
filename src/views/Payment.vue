<template>
  <div class="payment-page">
    <Navbar @logout="logout" />
    
    <div class="payment-container">
      <!-- No Subscription Selected Message -->
      <div v-if="!selectedPlan || selectedCars.length === 0" class="no-subscription-container">
        <div class="no-subscription-content">
          <div class="empty-icon">📋</div>
          <h2>No Plan Selected</h2>
          <p>Please select a subscription plan and car before proceeding to payment</p>
          <router-link to="/subscription" class="btn btn-primary">
            View Plans
          </router-link>
        </div>
      </div>

      <!-- Payment Form (shown only if subscription is selected) -->
      <div v-else class="payment-wrapper">
        <!-- Plan Summary Section -->
        <div class="plan-section">
          <h2>Purchase Plan</h2>
          
          <div class="plan-card">
            <div class="plan-name">{{ selectedPlan?.name }} Plan</div>
            <div class="plan-details">
              <div class="detail-row">
                <span class="label">Tier:</span>
                <span class="value">{{ selectedPlan?.tier || 'Basic' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">{{ selectedPlan?.duration_months }} month(s)</span>
              </div>
              <div class="detail-row">
                <span class="label">Car Swaps:</span>
                <span class="value">{{ selectedPlan?.swap_limit }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Price:</span>
                <span class="price">₹{{ selectedPlan?.price }}/month</span>
              </div>
              <div class="detail-row">
                <span class="label">Max Bookings:</span>
                <span class="value">₹{{ selectedPlan?.max_active_bookings || 1 }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Selected Cars:</span>
                <span class="value">{{ selectedCars.length }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Driver Service:</span>
                <span class="value">{{ formData.driverService ? 'Added' : 'Not Added' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <h2>Your Information</h2>
          
          <!-- Incomplete Details Alert -->
          <div v-if="!allDetailsComplete" class="alert alert-warning">
            <strong>⚠️ Incomplete Information</strong>
            <p>Please ensure all fields are filled with valid information:</p>
            <ul class="incomplete-list">
              <li v-if="!formData.fullname.trim()">• Full Name is required</li>
              <li v-if="!formData.email.trim()">• Email Address is required</li>
              <li v-if="!formData.licenseNumber.trim()">• License Number is required</li>
              <li v-if="!formData.licenseExpiry">• License Expiry Date is required</li>
              <li v-if="!formData.phone.trim()">• Phone Number is required</li>
            </ul>
          </div>
          
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
                disabled
                required
              />
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                v-model="formData.email"
                type="email"
                id="email"
                class="form-control"
                placeholder="john@example.com"
                disabled
                required
              />
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
                disabled
                required
              />
            </div>

            <!-- License Expiry Date -->
            <div class="form-group">
              <label for="licenseExpiry">License Expiry Date</label>
              <input 
                v-model="formData.licenseExpiry"
                type="date"
                id="licenseExpiry"
                class="form-control"
                disabled
                required
              />
            </div>

            <!-- Phone Number -->
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                v-model="formData.phone"
                type="tel"
                id="phone"
                class="form-control"
                placeholder="+91 9876543210"
                disabled
                required
              />
            </div>

            <!-- Driver Service Summary -->
            <div v-if="formData.driverService" class="driver-service-summary-inline">
              <div class="driver-service-summary-title">Driver Service Details</div>
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

            <!-- Selected Cars -->
            <div class="form-group">
              <label>Selected Cars</label>
              <div v-if="selectedCars.length > 0" class="selected-cars-list">
                <div v-for="car in selectedCars" :key="car.id" class="selected-car-preview">
                  <div class="car-image-wrapper">
                    <img :src="getCarImage(car)" loading="lazy" :alt="car.name" />
                  </div>
                  <div class="car-preview-info">
                    <div class="car-name">{{ car.brand }} {{ car.name }}</div>
                    <div class="car-category">{{ car.category || 'Sedan' }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="no-car-message">
                <span>No car selected</span>
              </div>
            </div>

            <!-- Terms -->
            <div class="form-group checkbox">
              <input 
                v-model="agreedToTerms"
                type="checkbox"
                id="terms"
              />
              <label for="terms">
                I agree to the terms and conditions and vehicle booking policy
              </label>
            </div>

            <!-- Buttons -->
            <div class="form-actions">
              <button 
                type="button"
                class="btn btn-secondary"
                @click="goBackToSubscription"
              >
                Back
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="isProcessing || !agreedToTerms || selectedCars.length === 0 || !allDetailsComplete"
              >
                {{ isProcessing ? 'Opening Razorpay...' : 'Pay Securely With Razorpay' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { paymentAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import { useUser } from '../composables/useUser'

const router = useRouter()
const cacheStore = useCacheStore()

const selectedPlan = ref(null)
const selectedCars = ref([])
const isProcessing = ref(false)
const isRazorpayLoaded = ref(false)
const errorMessage = ref('')
const agreedToTerms = ref(false)

// Use plans from Pinia cache store (no API call)
const plans = computed(() => cacheStore.subscriptionPlans)

const formData = ref({
  fullname: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  phone: '',
  driverService: null
})

// Check if all required fields are complete
const allDetailsComplete = computed(() => {
  return (
    formData.value.fullname.trim() !== '' &&
    formData.value.email.trim() !== '' &&
    formData.value.licenseNumber.trim() !== '' &&
    formData.value.licenseExpiry !== '' &&
    formData.value.phone.trim() !== ''
  )
})

const formatDriverDateTime = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const validateForm = () => {
  if (!formData.value.fullname.trim()) {
    errorMessage.value = 'Please enter your full name'
    return false
  }

  if (!formData.value.email.trim()) {
    errorMessage.value = 'Please enter your email'
    return false
  }

  if (!formData.value.licenseNumber.trim()) {
    errorMessage.value = 'Please enter your license number'
    return false
  }

  if (!formData.value.licenseExpiry) {
    errorMessage.value = 'Please select your license expiry date'
    return false
  }

  if (!formData.value.phone.trim()) {
    errorMessage.value = 'Please enter your phone number'
    return false
  }

  return true
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

const openRazorpayPopup = async (orderData) => {
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: 'CarSwap',
    description: `${selectedPlan.value?.name || 'Subscription'} Plan`,
    order_id: orderData.order_id,
    prefill: {
      name: formData.value.fullname,
      email: formData.value.email,
      contact: formData.value.phone
    },
    theme: {
      color: '#ff5722'
    },
    modal: {
      ondismiss: () => {
        isProcessing.value = false
      }
    },
    handler: async (response) => {
      try {
        await paymentAPI.verifyAndActivateSubscription(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
          selectedPlan.value.id,
          selectedCars.value.map((car) => car.id),
          formData.value.driverService
        )

        sessionStorage.removeItem('subscriptionCompleted')
        router.push({
          path: '/dashboard',
          query: { bookingSuccess: 'true', planName: selectedPlan.value.name }
        })
      } catch (error) {
        console.error('Payment verification/activation failed:', error)
        errorMessage.value = error.response?.data?.detail || 'Payment successful, but activation failed. Please contact support.'
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

const submitForm = async () => {
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  if (!selectedPlan.value || selectedCars.value.length === 0) {
    errorMessage.value = 'Invalid plan or car selection'
    return
  }

  const maxBookings = selectedPlan.value.max_active_bookings || 1
  if (selectedCars.value.length > maxBookings) {
    errorMessage.value = `You can book up to ${maxBookings} car(s) for this plan`
    return
  }

  isProcessing.value = true

  try {
    if (!isRazorpayLoaded.value && !(await loadRazorpayScript())) {
      throw new Error('Unable to load Razorpay checkout script')
    }

    const orderRes = await paymentAPI.createRazorpayOrder(
      selectedPlan.value.id,
      selectedCars.value.map((car) => car.id),
      formData.value.driverService
    )

    await openRazorpayPopup(orderRes.data)
  } catch (error) {
    console.error('Payment failed:', error)
    errorMessage.value = error.response?.data?.detail || 'Failed to complete payment. Please try again.'
    isProcessing.value = false
  }
}

const goBackToSubscription = () => {
  router.back()
}

const logout = () => {
  const { clearUser } = useUser()
  // Clear subscription flow flag on logout
  sessionStorage.removeItem('subscriptionCompleted')
  clearUser()
  router.push('/login')
}

const placeholder = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop'

const getCarImage = (car) => {
  if (car?.image) {
    if (car.image.startsWith('http')) return car.image
    return `https://cardb-1.onrender.com${car.image}`
  }
  return placeholder
}

const loadPlans = async () => {
  // Plans are already in cache from App.vue - NO API CALL HERE
  // Just use computed plans from Pinia store
}

onMounted(async () => {
  await loadRazorpayScript()

  // Load plans first
  await loadPlans()

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
    console.error('Failed to get user data:', error)
  }

  // Load values passed from Subscription step or Home flow.
  try {
    const savedPlan = localStorage.getItem('selectedPlanForPayment')
    const savedCars = localStorage.getItem('selectedCarsForPayment')
    const savedCar = localStorage.getItem('selectedCarForPayment')
    const savedFormDraft = localStorage.getItem('paymentFormDraft')

    if (savedPlan) {
      selectedPlan.value = JSON.parse(savedPlan)
      localStorage.removeItem('selectedPlanForPayment')
    }

    if (savedCars) {
      selectedCars.value = JSON.parse(savedCars)
      localStorage.removeItem('selectedCarsForPayment')
    } else if (savedCar) {
      const preSelectedCar = JSON.parse(savedCar)
      selectedCars.value = [preSelectedCar]
      
      // If plan was not passed, auto-match plan by car tier.
      if (!selectedPlan.value) {
        const carRequiredPlan = preSelectedCar.required_plan || 'basic'
        const matchingPlan = plans.value.find(plan => 
          (plan.tier || plan.name?.toLowerCase()).includes(carRequiredPlan)
        )

        if (matchingPlan) {
          selectedPlan.value = matchingPlan
        }
      }

      localStorage.removeItem('selectedCarForPayment')
    }

    if (savedFormDraft) {
      const formDraft = JSON.parse(savedFormDraft)
      formData.value = {
        ...formData.value,
        ...formDraft
      }
      localStorage.removeItem('paymentFormDraft')
    }

    if (selectedCars.value.length === 0 || !selectedPlan.value) {
      // Clear flag if payment data is missing
      sessionStorage.removeItem('subscriptionCompleted')
      router.push('/subscription')
      return
    }
  } catch (error) {
    console.error('Failed to load payment data:', error)
    // Clear flag on error
    sessionStorage.removeItem('subscriptionCompleted')
    router.push('/subscription')
  }
})
</script>

<style scoped>
.payment-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: var(--cs-navbar-offset);
  padding-bottom: 40px;
}

.payment-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

/* No Subscription Container */
.no-subscription-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-subscription-content {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  display: inline-block;
}

.no-subscription-container h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.no-subscription-container p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.no-subscription-container .btn-primary {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.payment-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Plan Section */
.plan-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a2e;
}

.plan-card {
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.detail-row .label {
  opacity: 0.9;
  font-weight: 500;
}

.detail-row .value {
  font-weight: 600;
  font-size: 1rem;
}

.detail-row .price {
  font-size: 1.3rem;
  font-weight: 700;
}

/* Form Section */
.form-section h2 {
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

.selected-car-display {
  padding: 0.75rem;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  color: #1a1a2e;
}

.selected-car-display .no-car {
  color: #999;
}

.selected-car-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.selected-cars-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.car-image-wrapper {
  border-radius: 8px;
  overflow: hidden;
  max-height: 150px;
  min-height: 120px;
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

.car-preview-info {
  text-align: left;
}

.car-preview-info .car-name {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 0.9rem;
}

.car-preview-info .car-category {
  font-size: 0.8rem;
  color: #666;
}

.no-car-message {
  padding: 0.75rem;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #999;
  text-align: center;
}

.driver-service-summary-inline {
  padding: 1rem;
  margin-bottom: 1.25rem;
  background: #fff4ef;
  border: 1px solid #ffd5c7;
  border-radius: 12px;
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
  color: #7a5a49;
  margin-bottom: 0.25rem;
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

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
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

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
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

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-warning strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.alert-warning p {
  margin: 0.5rem 0 0.5rem 0;
  font-size: 0.9rem;
}

.incomplete-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.incomplete-list li {
  padding: 0.25rem 0;
  margin: 0;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .payment-wrapper {
    grid-template-columns: 1fr;
  }

  .driver-service-summary-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    grid-template-columns: 1fr;
  }
}
</style>
