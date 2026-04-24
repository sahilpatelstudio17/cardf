<template>
  <header class="cs-navbar" :class="{ scrolled: isScrolled }">
    <div class="cs-navbar-inner d-flex align-items-center">
      <div class="cs-navbar-left d-flex align-items-center">
        <router-link class="brand" to="/">Car<span>Swap</span></router-link>
      </div>

      <!-- Mobile Menu Toggle -->
      <button class="mobile-menu-toggle" :class="{ active: mobileMenuOpen }" @click="toggleMobileMenu">
        <div class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <nav class="cs-nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
        <!-- Mobile Close Button -->
        <button class="mobile-close-btn" @click="closeMobileMenu" v-if="mobileMenuOpen">
          <span>×</span>
        </button>

        <router-link to="/" class="nav-link" @click="scrollToTop">Home</router-link>
        <a href="/#vehicles" class="nav-link" @click="scrollToSection('vehicles')">Cars</a>
        <a href="/#plans" class="nav-link" @click="scrollToSection('plans')">Plans</a>
        <a href="/#about" class="nav-link" @click="scrollToSection('about')">About Us</a>
        <a href="/#contact" class="nav-link" @click="scrollToSection('contact')">Contact</a>
        
        <template v-if="isAuthenticated">
          <router-link v-if="isAdmin" to="/admin" class="nav-link" @click="closeMobileMenu">Admin</router-link>
          <template v-else>
            <router-link to="/dashboard" class="nav-link" @click="closeMobileMenu">Dashboard</router-link>
          </template>
        </template>

        <div class="mobile-auth-actions">
          <template v-if="isAuthenticated">
            <div class="mobile-user-name">Hi, {{ userName }}</div>
            <button class="cs-btn-primary mobile-logout-btn" @click="handleLogout">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login" class="cs-btn-primary" @click="closeMobileMenu">Login</router-link>
          </template>
        </div>
      </nav>

      <div class="cs-navbar-right d-flex align-items-center desktop-auth-actions">
        <template v-if="isAuthenticated">
          <span class="user-greeting d-none d-md-inline me-2">Hi, {{ userName }}</span>
          <button class="cs-btn-primary" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <!-- <router-link to="/login" class="cs-btn-ghost me-2" style="color: #333; border-color: #ddd;">Login</router-link> -->
          <router-link to="/login" class="cs-btn-primary">Login</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUser } from '../composables/useUser'
import { useCacheStore } from '../stores/cacheStore'

const emit = defineEmits(['logout'])
const router = useRouter()
const route = useRoute()
const cacheStore = useCacheStore()
const { isAuthenticated, userName, isAdmin, fetchCurrentUser } = useUser()

const mobileMenuOpen = ref(false)
const isScrolled = ref(false)

const handleLogout = () => {
  // Clear cache store when user logs out
  cacheStore.clearCache()
  emit('logout')
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const scrollToTop = () => {
  closeMobileMenu()
  if (route.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const scrollToSection = (sectionId) => {
  closeMobileMenu()
  if (route.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    })
  } else {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  
  // Fetch user data on component mount if authenticated
  if (localStorage.getItem('access_token')) {
    fetchCurrentUser().catch(err => {
      console.error('Failed to fetch user on navbar mount:', err)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  }
)
</script>

<style scoped>
.user-greeting {
  color: #666;
  font-size: 0.9rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.mobile-auth-actions {
  display: none;
}

.mobile-user-name {
  font-size: 0.95rem;
  color: #444;
  font-weight: 600;
}

.mobile-logout-btn {
  min-width: 150px;
}



.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1002;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: #333;
  transition: all 0.3s ease;
}

.mobile-menu-toggle.active .hamburger span:nth-child(1) {
  transform: rotate(45deg) translate(10px, 10px);
}

.mobile-menu-toggle.active .hamburger span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active .hamburger span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

@media (max-width: 991px) {
  .mobile-menu-toggle {
    display: block;
  }
.cs-nav-links {
    position: fixed;
    top: 0;              /* 🔥 full screen */
    left: 0;
    width: 100%;
    height: 100vh;      /* 🔥 full height */
    background-color: white;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;

    padding: 80px 20px 20px; /* space for navbar */
    
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    z-index: 9999;
    overflow-y: auto;
  }

  /* .cs-nav-links {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem 1.5rem;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1001;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  } */

  .cs-nav-links.mobile-open {
    transform: translateX(0);
  }

  .cs-nav-links .nav-link {
    font-size: 1.1rem;
    padding: 0.75rem 0;
    color: #333;
    text-decoration: none;
    display: block;
    border-bottom: 1px solid #eee;
    transition: color 0.2s ease;
  }

  .cs-nav-links .nav-link:hover {
    color: #ff4d30;
  }

  .cs-navbar-right {
    position: relative;
    z-index: 1001;
  }

  .desktop-auth-actions {
    display: none !important;
  }

  .mobile-auth-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
    width: 100%;
  }
  
  .mobile-close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    background: none;
    border: none;
    font-size: 2.5rem;
    cursor: pointer;
    color: #333;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s ease;
    z-index: 10003;
  }

  .mobile-close-btn:hover {
    color: #ff4d30;
  }
  
  .d-none.d-md-inline {
    display: none !important;
  }
}
</style>
