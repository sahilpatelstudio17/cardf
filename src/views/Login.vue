<template>
  <div class="auth-page">
    <!-- Background image overlay -->
    <div class="auth-bg-overlay"></div>
    
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <router-link to="/" class="brand">CarSwap</router-link>
          <h2>Welcome Back</h2>
          <p>Sign in to access your account</p>
        </div>
        
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="alert alert-success" role="alert">
          {{ successMessage }}
        </div>

        <form @submit.prevent="login">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              v-model="email" 
              type="email"
              class="form-control" 
              id="email"
              placeholder="Enter your email"
              @input="clearError"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              v-model="password" 
              type="password" 
              class="form-control" 
              id="password"
              placeholder="Enter your password"
              @input="clearError"
              required
            />
          </div>

          <button 
            type="submit"
            class="cs-btn-primary w-100"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <router-link to="/signup">Create Account</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authAPI } from '../services/api'
import { useUser } from '../composables/useUser'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const router = useRouter()
const route = useRoute()
const { fetchCurrentUser } = useUser()

onMounted(() => {
  // Check for registration success message
  if (route.query.registered === 'true') {
    successMessage.value = 'Account created successfully! Please sign in.'
  }
  
  // Load error message from localStorage if exists (from page refresh)
  const storedError = localStorage.getItem('login_error')
  if (storedError) {
    errorMessage.value = storedError
    localStorage.removeItem('login_error')
  }
})

const login = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Step 1: Get JWT token from backend
    const response = await authAPI.login(email.value, password.value)
    const token = response.data.access_token
    
    // Store token in localStorage (only token, not user data)
    localStorage.setItem('access_token', token)
    
    // Step 2: Fetch user data from backend (stored in composable)
    await fetchCurrentUser()
    
    // Step 3: Redirect based on role or stored car
    const redirectUrl = route.query.redirect
    const { currentUser } = useUser()
    const selectedCarForSubscription = localStorage.getItem('selectedCarForSubscription')
    
    if (redirectUrl) {
      router.push(redirectUrl)
    } else if (selectedCarForSubscription) {
      // User selected a car before login - redirect to subscription with auto-selection
      router.push('/subscription')
    } else if (currentUser.value?.is_admin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Login error:', error)
    // Clear token on error
    localStorage.removeItem('access_token')
    
    let message = 'Login failed. Please try again.'
    if (error.response?.data?.detail) {
      message = error.response.data.detail
    } else if (error.response?.status === 401) {
      message = 'Invalid email or password'
    }
    
    errorMessage.value = message
    localStorage.setItem('login_error', message)
  } finally {
    isLoading.value = false
  }
}

const clearError = () => {
  errorMessage.value = ''
  localStorage.removeItem('login_error')
}
</script>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  background: url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat fixed;
  box-sizing: border-box;
}

.auth-bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header .brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff4d30;
  text-decoration: none;
  display: block;
  margin-bottom: 20px;
}

.auth-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 8px;
}

.auth-header p {
  color: #666;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group .form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group .form-control:focus {
  outline: none;
  border-color: #ff4d30;
}

.cs-btn-primary {
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 10px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.auth-footer p {
  color: #666;
  margin: 0;
}

.auth-footer a {
  color: #ff4d30;
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.alert-danger {
  background: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.alert-success {
  background: #efe;
  color: #060;
  border: 1px solid #cfc;
}
</style>

