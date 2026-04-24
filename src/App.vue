<template>
  <RouterView />
  <AIAssistantWidget />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCacheStore } from './stores/cacheStore'
import AIAssistantWidget from './components/AIAssistantWidget.vue'

const cacheStore = useCacheStore()

onMounted(async () => {
  // Step 1: Load static data (cars & plans) - available for all users
  await Promise.all([
    cacheStore.loadCars(),
    cacheStore.loadPlans()
  ])

  // Step 2: Load user-specific data if authenticated
  const token = localStorage.getItem('access_token')
  if (token) {
    await cacheStore.loadUserData()
  }
})
</script>

<style scoped>

</style>