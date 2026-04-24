import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/home.vue'
import { useUser } from '../composables/useUser'

// Lazy load route components for code splitting
const Login = () => import('../views/Login.vue')
const Signup = () => import('../views/Signup.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const Cars = () => import('../views/Cars.vue')
const Subscription = () => import('../views/Subscription.vue')
const Payment = () => import('../views/Payment.vue')
const Swap = () => import('../views/Swap.vue')
const Admin = () => import('../views/Admin.vue')
const About = () => import('../views/About.vue')
const Contact = () => import('../views/Contact.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: false } },
  { path: '/login', component: Login, meta: { requiresAuth: false, guestOnly: true } },
  { path: '/signup', component: Signup, meta: { requiresAuth: false, guestOnly: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/cars', component: Cars, meta: { requiresAuth: false } },
  { path: '/subscription', component: Subscription, meta: { requiresAuth: true } },
  { path: '/payment', component: Payment, meta: { requiresAuth: true } },
  { path: '/swap', component: Swap, meta: { requiresAuth: true } },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/about', component: About, meta: { requiresAuth: false } },
  { path: '/contact', component: Contact, meta: { requiresAuth: false } },
  {
  path: '/not-found',
  name: 'NotFound',
  component: NotFound
},
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { requiresAuth: false } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Cache user promise to avoid multiple fetches
let userFetchPromise = null

// Route guard - check authentication and admin access
router.beforeEach(async (to, from) => {
  const token = localStorage.getItem('access_token')
  const { currentUser, fetchCurrentUser, isAdmin } = useUser()
  
  // allow not found page
  if (to.name === 'NotFound') {
    return true
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !token) {
    return '/login'
  }
  
  // If user has token but no user data loaded, fetch it once
  if (token && !currentUser.value) {
    try {
      // Reuse the promise if already fetching
      if (!userFetchPromise) {
        userFetchPromise = fetchCurrentUser()
      }
      await userFetchPromise
    } catch (error) {
      userFetchPromise = null // Reset on error
      console.error('Failed to fetch user in router guard:', error)
      // If fetch fails with 401, token is invalid
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        if (to.meta.requiresAuth) {
          return '/login'
        }
      }
    }
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin) {
    if (!isAdmin.value) {
      return { name: 'NotFound' }
    }
  }
  
  // Redirect logged-in users away from guest-only pages
  if (to.meta.guestOnly && token) {
    if (isAdmin.value) {
      return '/admin'
    } else {
      return '/'
    }
  }
  
  // Payment page can only be accessed after completing subscription form
  if (to.path === '/payment') {
    const subscriptionCompleted = sessionStorage.getItem('subscriptionCompleted')
    if (!subscriptionCompleted) {
      return '/subscription'
    }
  }
  
  return true
})

export default router
