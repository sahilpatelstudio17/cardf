<template>
  <div class="auth-page">
    <!-- Background image overlay -->
    <div class="auth-bg-overlay"></div>
    
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <router-link to="/" class="brand">CarSwap</router-link>
          <h2>Create Account</h2>
          <p>Join CarSwap and start your journey</p>
        </div>
        
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="signup">
          <div class="form-group">
            <label for="fullname">Full Name</label>
            <input 
              v-model="fullname" 
              type="text"
              class="form-control" 
              id="fullname"
              placeholder="Enter your full name"
              @input="handleFullnameInput"
              required
            />
            <small v-if="fullnameError" class="error-text">{{ fullnameError }}</small>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              v-model="email" 
              type="text"
              class="form-control" 
              id="email"
              placeholder="Enter your email"
              @input="handleEmailInput"
              required
            />
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              v-model="password" 
              type="password" 
              class="form-control" 
              id="password"
              placeholder="Create a password "
              @input="handlePasswordInput"
              required
            />
            <!-- <small v-if="passwordError" class="error-text">{{ passwordError }}</small> -->
            <div v-if="passwordHint" class="password-hint">
              <small>Password must have:</small>
              <ul class="password-requirements">
                <li :class="{ valid: has6Chars, invalid: !has6Chars }">✓ 6+ characters</li>
                <li :class="{ valid: hasUppercase, invalid: !hasUppercase }">✓ 1 uppercase letter (A-Z)</li>
                <li :class="{ valid: hasLowercase, invalid: !hasLowercase }">✓ 1 lowercase letter (a-z)</li>
                <li :class="{ valid: hasNumber, invalid: !hasNumber }">✓ 1 number (0-9)</li>
              </ul>
            </div>
          </div>

          <button 
            type="submit"
            class="cs-btn-primary w-100"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <router-link to="/login">Sign In</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'
import { validateFullname, sanitizeFullname, validateEmail, validatePassword } from '../utils/validators'

const fullname = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const fullnameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const passwordHint = ref(false)
const isLoading = ref(false)
const router = useRouter()

// Password requirement checks
const has6Chars = ref(false)
const hasUppercase = ref(false)
const hasLowercase = ref(false)
const hasNumber = ref(false)

// Handle fullname input with validation
const handleFullnameInput = (event) => {
  const sanitized = sanitizeFullname(event.target.value)
  fullname.value = sanitized
  
  // Show validation error if input has invalid characters
  const validation = validateFullname(sanitized)
  fullnameError.value = validation.isValid ? '' : validation.message
}

// Handle email input with validation
const handleEmailInput = (event) => {
  email.value = event.target.value
  const validation = validateEmail(email.value)
  emailError.value = validation.isValid ? '' : validation.message
}

// Handle password input with validation
const handlePasswordInput = (event) => {
  password.value = event.target.value
  
  // Check password requirements
  has6Chars.value = password.value.length >= 6
  hasUppercase.value = /[A-Z]/.test(password.value)
  hasLowercase.value = /[a-z]/.test(password.value)
  hasNumber.value = /[0-9]/.test(password.value)
  
  // Show hint if user started typing
  passwordHint.value = password.value.length > 0
  
  // Show validation error
  const validation = validatePassword(password.value)
  passwordError.value = validation.isValid ? '' : validation.message
}

const signup = async () => {
  errorMessage.value = ''
  isLoading.value = true

  // Validate all fields
  const fullnameValidation = validateFullname(fullname.value)
  const emailValidation = validateEmail(email.value)
  const passwordValidation = validatePassword(password.value)
  
  // Show errors if validation fails
  fullnameError.value = fullnameValidation.isValid ? '' : fullnameValidation.message
  emailError.value = emailValidation.isValid ? '' : emailValidation.message
  passwordError.value = passwordValidation.isValid ? '' : passwordValidation.message
  
  if (!fullnameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid) {
    isLoading.value = false
    return
  }

  try {
    await authAPI.signup(email.value, password.value, fullname.value.trim())
    
    // redirect to login with success message
    router.push('/login?registered=true')
  } catch (error) {
    console.error('Signup error:', error)
    if (error.isBackendMismatch) {
      errorMessage.value = 'Wrong backend is running. Start CarSwap backend and set VITE_API_BASE_URL correctly.'
    } else if (error.response?.data?.detail) {
      // Handle specific field errors from backend
      const detail = error.response.data.detail
      if (typeof detail === 'string') {
        if (detail.includes('email')) {
          emailError.value = 'Email already registered'
        } else {
          errorMessage.value = detail
        }
      } else {
        errorMessage.value = 'Signup failed. Please try again.'
      }
    } else if (error.response?.status === 400) {
      errorMessage.value = 'Invalid input. Please check all fields.'
    } else {
      errorMessage.value = 'Signup failed. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
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

.error-text {
  color: #dc3545;
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
}

.password-hint {
  margin-top: 10px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.password-hint small {
  display: block;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.password-requirements {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  font-size: 0.85rem;
  padding: 4px 0;
  color: #666;
}

.password-requirements li.valid {
  color: #28a745;
  font-weight: 500;
}

.password-requirements li.invalid {
  color: #dc3545;
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
</style>
