<template>
  <div class="home-page">
    <!-- Navigation -->
    <Navbar @logout="logout" />

    <!-- Hero Section -->
    <section id="home" class="cs-hero">
      <img 
        class="hero-bg" 
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Crect fill='%23333' width='1200' height='600'/%3E%3C/svg%3E"
        data-src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop"
        alt="Luxury car"
        loading="eager" 
        decoding="async"
      />
      <div class="overlay"></div>
      <div class="hero-content">
        <div class="hero-inner fade-in-up">
          <h1>Drive Your Way with<br/>Flexible Subscription</h1>
          <p class="lead">Rent. Swap. Upgrade. Anytime.<br/>The smarter way to drive premium vehicles.</p>
          <div class="d-flex gap-3 flex-wrap">
            <a href="#vehicles" class="cs-btn-primary" @click.prevent="scrollToSection('vehicles')">View Cars</a>
            <a href="#plans" class="cs-btn-ghost" @click.prevent="scrollToSection('plans')">Choose Plan</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature Cards -->
    <section class="features-section py-5">
      <div class="container">
        <div class="feature-cards-wrapper">
          <div class="feature-card">
            <h4>Flexible Subscription</h4>
            <p>Monthly plans that fit your lifestyle. No long-term commitments.</p>
          </div>
          <div class="feature-card">
            <h4>Easy Car Swap</h4>
            <p>Switch vehicles anytime based on your needs and preferences.</p>
          </div>
          <div class="feature-card">
            <h4>Admin Approved Security</h4>
            <p>Every booking is verified for your peace of mind.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cars Section -->
    <section id="vehicles" class="vehicles-section py-5">
      <div class="container">
        <div class="section-header">
          <div class="header-title">
            <h2>Our <span>Fleet</span></h2>
            <p>Choose from our curated selection of premium vehicles</p>
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

        <div v-if="isLoadingCars" class="text-center py-5">
          <div class="loading">Loading cars...</div>
        </div>

        <div v-else-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <div v-else-if="filteredCars.length > 0" class="cs-grid">
          <div v-for="car in filteredCars" :key="car.id" class="cs-card">
            <div class="image-wrapper">
              <img 
                :src="getCarImage(car)" 
                :alt="car.name"
                loading="lazy"
                decoding="async"
                class="image"
              />
              <span class="category-badge">{{ car.category || 'Sedan' }}</span>
              <span :class="['plan-badge', car.required_plan || 'basic']">
                {{ car.required_plan || 'Basic' }}
              </span>
            </div>
            <div class="body">
              <h3 class="title">{{ car.brand }} {{ car.name }}</h3>
              <p class="subtitle">{{ car.category || 'Premium Vehicle' }}</p>
              <p class="location-text">📍 {{ car.location || 'Ahmedabad, Gujarat' }}</p>
              <div class="card-footer">
                <button 
                  class="cs-btn-primary w-100" 
                  @click="requestBooking(car)"
                  :disabled="!car.available"
                >
                  {{ car.available ? 'Request Booking' : 'Not Available' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-5">
          <p class="text-muted">{{ selectedTier ? 'No cars found for the selected tier' : 'No cars available at the moment' }}</p>
        </div>
      </div>
    </section>

    <!-- Subscription Plans Section -->
    <section id="plans" class="plans-section py-5">
      <div class="container">
        <div class="section-header">
          <div class="header-title">
            <h2>Subscription <span>Plans</span></h2>
            <p>Choose the plan that fits your driving needs</p>
          </div>
        </div>

        <div v-if="isLoadingPlans" class="text-center py-5">
          <div class="loading">Loading plans...</div>
        </div>

        <div v-else class="plans-grid">
          <div 
            v-for="(plan, index) in subscriptionPlans" 
            :key="plan.id" 
            :class="['plan-card', { featured: index === 1 }]"
          >
            <div class="plan-name">{{ plan.name }}</div>
            <div class="plan-price">₹{{ plan.price }}<span>/mo</span></div>
            <div class="plan-duration">{{ plan.duration_months }} month{{ plan.duration_months > 1 ? 's' : '' }}</div>
            <ul class="plan-features">
              <li>{{ plan.max_active_bookings || 1 }} active booking{{ (plan.max_active_bookings || 1) > 1 ? 's' : '' }}</li>
              <li>{{ plan.swap_limit }} swap{{ plan.swap_limit !== 1 ? 's' : '' }}/month</li>
              <li v-if="plan.tier === 'premium' || plan.tier === 'luxury'">Access to premium cars</li>
              <li v-if="plan.tier === 'luxury'">Access to all vehicles</li>
              <li>24/7 Support</li>
              <li>Insurance included</li>
            </ul>
            <button class="cs-btn-primary w-100" @click="selectPlan(plan)">
              Purchase Plan
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about-section py-5">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6 mb-4 mb-lg-0">
            <div class="about-image-wrapper">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23ccc' width='800' height='600'/%3E%3C/svg%3E"
                data-src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop" 
                alt="About CarSwap"
                loading="eager" 
                decoding="async"
                class="about-img"
              />
            </div>
          </div>
          <div class="col-lg-6">
            <div class="about-content">
              <h2 class="mb-4">About <span style="color: #ff4d30;">CarSwap</span></h2>
              <p class="lead mb-4">
                We're reimagining car ownership for the modern driver. No more long-term 
                commitments, maintenance worries, or depreciation concerns.
              </p>
              <p class="text-muted mb-4">
                Founded in 2024, CarSwap has grown to serve thousands of happy customers 
                who enjoy the freedom of driving premium vehicles without the hassles of ownership.
              </p>
              <div class="about-stats">
                <div class="stat-item">
                  <div class="stat-value">500+</div>
                  <div class="stat-label">Premium Vehicles</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">10K+</div>
                  <div class="stat-label">Happy Customers</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">98%</div>
                  <div class="stat-label">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="contact-wrapper">
              <div class="row">
                <div class="col-lg-5 mb-4 mb-lg-0">
                  <div class="contact-info">
                    <h3>Get in Touch</h3>
                    <p>Have questions? We'd love to hear from you.</p>
                    <div class="contact-details">
                      <div class="contact-item">
                        <strong>Email</strong>
                        <span>autodrive@carswap.com</span>
                      </div>
                      <div class="contact-item">
                        <strong>Phone</strong>
                        <span>+91 9773228085</span>
                      </div>
                      <div class="contact-item">
                        <strong>Address</strong>
                        <span>123 Auto Drive, Ahmedabad ,Gujarat</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-7">
                  <form @submit.prevent="handleContactSubmit" class="contact-form">
                    <div class="mb-3">
                      <input 
                        type="text" 
                        v-model="contactForm.name" 
                        class="form-control contact-input" 
                        placeholder="Your Name" 
                        required
                      />
                    </div>
                    <div class="mb-3">
                      <input 
                        type="email" 
                        v-model="contactForm.email" 
                        class="form-control contact-input" 
                        placeholder="Your Email" 
                        required
                      />
                    </div>
                    <div class="mb-4">
                      <textarea 
                        v-model="contactForm.message" 
                        class="form-control contact-input" 
                        placeholder="Your Message" 
                        rows="5" 
                        required
                      ></textarea>
                    </div>
                    <button type="submit" class="cs-btn-primary w-100" :disabled="isSubmittingContact">
                      {{ isSubmittingContact ? 'Sending...' : 'Send Message' }}
                    </button>
                    <p v-if="contactSubmitted" class="alert alert-success mt-3 text-center">
                      Thank you! We'll get back to you soon.
                    </p>
                    <p v-if="contactError" class="alert alert-danger mt-3 text-center">
                      {{ contactError }}
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="cs-footer">
      <div class="container">
        <div class="row">
          <div class="col-md-4 mb-4">
            <h5>CarSwap</h5>
            <p>Premium car subscriptions with flexible plans and easy swaps. Drive the car you want, when you want it.</p>
          </div>
          <div class="col-md-4 mb-4">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#vehicles" @click.prevent="scrollToSection('vehicles')">Browse Cars</a></li>
              <li><a href="#plans" @click.prevent="scrollToSection('plans')">Subscription Plans</a></li>
              <li><a href="#about" @click.prevent="scrollToSection('about')">About Us</a></li>
              <li><a href="#contact" @click.prevent="scrollToSection('contact')">Contact</a></li>
            </ul>
          </div>
          <div class="col-md-4 mb-4">
            <h5>Contact Info</h5>
            <ul>
              <li>autodrive@carswap.com</li>
              <li>91 9778587878</li>
              <li>Ahmedabad ,Gujarat</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom text-center pt-4">
          <p>&copy; 2026 CarSwap. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <!-- Booking Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="closeBookingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Request Booking</h3>
          <button class="modal-close" @click="closeBookingModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedCar">
          <div class="car-preview">
            <img 
              :src="getCarImage(selectedCar)" 
              :alt="selectedCar.name"
              loading="lazy"
              decoding="async"
            />
            <div class="car-details">
              <h4>{{ selectedCar.brand }} {{ selectedCar.name }}</h4>
              <p>{{ selectedCar.category || 'Sedan' }}</p>
            </div>
          </div>
          
          <div v-if="!isAuthenticated" class="auth-required">
            <p>Please login to request a booking</p>
            <button @click="goToLoginWithCar" class="cs-btn-primary">Login</button>
          </div>
          
          <div v-else-if="!hasSubscription" class="subscription-required">
            <p>You need an active subscription to book a car</p>
            <button class="cs-btn-primary" @click="goToPlans">Book Car</button>
          </div>
          
          <div v-else>
            <div class="form-group mb-3">
              <label>Note (optional)</label>
              <textarea 
                v-model="bookingNote" 
                class="form-control" 
                placeholder="Any special requests..."
                rows="3"
              ></textarea>
            </div>
            <button 
              class="cs-btn-primary w-100" 
              @click="submitBooking"
              :disabled="isSubmittingBooking"
            >
              {{ isSubmittingBooking ? 'Submitting...' : 'Submit Request' }}
            </button>
            <p class="booking-info mt-3">
              Your booking request will be sent for admin approval. You'll be notified once approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { carsAPI, subscriptionAPI, bookingAPI, contactAPI } from '../services/api'
import { useCacheStore } from '../stores/cacheStore'
import Navbar from '../components/Navbar.vue'
import { useUser } from '../composables/useUser'

const router = useRouter()
const cacheStore = useCacheStore()

// Data refs
const selectedTier = ref('')

// Contact form
const contactForm = ref({ name: '', email: '', message: '' })
const contactSubmitted = ref(false)
const contactError = ref('')
const isSubmittingContact = ref(false)

// Booking modal
const showBookingModal = ref(false)
const selectedCar = ref(null)
const bookingNote = ref('')
const isSubmittingBooking = ref(false)
const hasSubscription = ref(false)

// Computed
const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))
const cars = computed(() => cacheStore.cars)
const subscriptionPlans = computed(() => cacheStore.subscriptionPlans)
const isLoadingCars = computed(() => cacheStore.isLoadingCars)
const isLoadingPlans = computed(() => cacheStore.isLoadingPlans)
const errorMessage = computed(() => cacheStore.errorMessage)

const filteredCars = computed(() => {
  if (!selectedTier.value) return cars.value
  return cars.value.filter(car => {
    const carTier = (car.required_plan || 'basic').toLowerCase()
    return carTier === selectedTier.value
  })
})

// Image helper
const getCarImage = (car) => {
  const placeholder = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&auto=format&fit=crop'
  if (!car?.image) return placeholder
  if (car.image.startsWith('http')) return car.image
  return `http://localhost:8000${car.image}`
}

// Check subscription (use cached data - NO API CALL)
const checkSubscription = async () => {
  if (!isAuthenticated.value) return
  // Check if user has subscription in cache
  hasSubscription.value = cacheStore.userSubscription !== null
}

// Actions
const requestBooking = (car) => {
  selectedCar.value = car
  bookingNote.value = ''
  showBookingModal.value = true
}

const closeBookingModal = () => {
  showBookingModal.value = false
  selectedCar.value = null
}

const goToPlans = () => {
  if (selectedCar.value) {
    // Store the car for pre-selection and auto-plan-selection on subscription page
    localStorage.setItem('selectedCarForSubscription', JSON.stringify(selectedCar.value))
    closeBookingModal()
    
    // Check if user is logged in
    const token = localStorage.getItem('access_token')
    if (token) {
      // User is logged in - redirect to subscription page with auto-selection
      router.push('/subscription')
    } else {
      // User not logged in - redirect to login page, will then go to subscription after login
      router.push('/login')
    }
  } else {
    closeBookingModal()
    scrollToSection('plans')
  }
}

const goToLoginWithCar = () => {
  if (selectedCar.value) {
    // Store the car for pre-selection and auto-plan-selection on subscription page
    localStorage.setItem('selectedCarForSubscription', JSON.stringify(selectedCar.value))
  }
  closeBookingModal()
  // Redirect to login page - after login, will redirect to subscription with car pre-selected
  router.push('/login')
}

const submitBooking = async () => {
  if (!selectedCar.value) return
  
  isSubmittingBooking.value = true
  try {
    await bookingAPI.createBooking(selectedCar.value.id, bookingNote.value)
    closeBookingModal()
    alert('Booking request submitted! Waiting for admin approval.')
    router.push('/dashboard')
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to submit booking'
    alert(message)
  } finally {
    isSubmittingBooking.value = false
  }
}

const selectPlan = (plan) => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  localStorage.setItem('selectedPlan', JSON.stringify(plan))
  router.push('/subscription')
}

const handleContactSubmit = async () => {
  isSubmittingContact.value = true
  contactError.value = ''
  
  try {
    await contactAPI.submitWithN8n(contactForm.value.name, contactForm.value.email, contactForm.value.message)
    contactSubmitted.value = true
    contactForm.value = { name: '', email: '', message: '' }
    setTimeout(() => {
      contactSubmitted.value = false
    }, 5000)
  } catch (error) {
    contactError.value = 'Failed to send message. Please try again.'
  } finally {
    isSubmittingContact.value = false
  }
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const logout = () => {
  const { clearUser } = useUser()
  clearUser()
  router.push('/')
  window.location.reload()
}

// Lazy load images with data-src attribute
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]')
  images.forEach(img => {
    if (img.dataset.src) {
      const newImg = new Image()
      newImg.onload = () => {
        img.src = img.dataset.src
        img.removeAttribute('data-src')
      }
      newImg.onerror = () => {
        console.warn(`Failed to load image: ${img.dataset.src}`)
      }
      newImg.src = img.dataset.src
    }
  })
}

const scrollToVehicles = () => {
  const vehiclesSection = document.getElementById('vehicles')
  if (vehiclesSection) {
    vehiclesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleHashChange = () => {
  if (window.location.hash === '#vehicles') {
    setTimeout(() => {
      scrollToVehicles()
    }, 100)
  }
}

onMounted(async () => {
  // Data is already loaded in App.vue - just use it from cache
  // NO API calls here - data comes from Pinia store
  if (isAuthenticated.value) {
    await checkSubscription()
  }
  
  // Load images asynchronously after page renders
  setTimeout(() => {
    lazyLoadImages()
  }, 0)
  
  // Auto-scroll to vehicles section if hash is present
  setTimeout(() => {
    if (window.location.hash === '#vehicles') {
      scrollToVehicles()
    }
  }, 300)
  
  // Handle hash changes while on the page
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<style scoped>
.home-page {
  background: #f8f9fa;
  width: 100%;
  overflow-x: hidden;
}

/* Features Section */
.features-section {
  background: #fff;
  margin-top: -100px;
  position: relative;
  z-index: 10;
}

.feature-cards-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

/* Section Header with Filters */
.section-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  text-align: center;
}

.header-title {
  width: 100%;
  text-align: center;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.section-header h2 span {
  color: #ff5722;
}

.section-header p {
  color: #666;
  font-size: 1rem;
  margin: 0 auto;
  text-align: center;
  max-width: 600px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
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

.location-text {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.feature-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #111;
}

.feature-card p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Vehicles Section */
.vehicles-section {
  background: #fff;
  padding: 5rem 0;
}

/* Plans Section */
.plans-section {
  background: #f8f9fa;
  padding: 5rem 0;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* About Section */
.about-section {
  background: #fff;
  padding: 5rem 0;
}

.about-stats {
  display: flex;
  gap: 3rem;
  margin-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ff4d30;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* Contact Section */
.contact-section {
  background: linear-gradient(135deg, #f0f2f5 0%, #fff 100%);
  padding: 5rem 0;
}

.contact-wrapper {
  background: #fff;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}

.contact-info h3 {
  margin-bottom: 1rem;
}

.contact-details {
  margin-top: 2rem;
}

.contact-item {
  margin-bottom: 1.5rem;
}

.contact-item strong {
  display: block;
  color: #111;
  margin-bottom: 0.25rem;
}

.contact-item span {
  color: #666;
}

/* Modal */
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
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 2rem;
}

.car-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.car-preview img {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 10px;
}

.car-preview h4 {
  margin: 0 0 0.25rem;
}

.car-preview p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.auth-required,
.subscription-required {
  text-align: center;
  padding: 2rem 0;
}

.auth-required p,
.subscription-required p {
  margin-bottom: 1rem;
  color: #666;
}

.booking-info {
  font-size: 0.85rem;
  color: #888;
  text-align: center;
}

/* Responsive */
@media (max-width: 1024px) {
  .section-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
  }

  .filter-buttons {
    justify-content: center;
  }
}

@media (max-width: 991px) {
  .feature-cards-wrapper {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
  
  .about-stats {
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .stat-item {
    flex: 1;
    min-width: 100px;
  }
}

@media (max-width: 640px) {
  .features-section {
    margin-top: -50px;
  }
  
  .contact-wrapper {
    padding: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
