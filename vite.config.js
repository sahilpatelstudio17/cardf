import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'axios', 'bootstrap'],
          'ui-components': ['./src/components/CarCard.vue', './src/components/Navbar.vue', './src/components/SubscriptionCard.vue'],
        }
      }
    },
    // Optimize chunk sizes
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }
    }
  },
  // Optimize for performance
  server: {
    preTransformRequests: true,
  }
})
