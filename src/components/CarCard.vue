<template>
  <article class="cs-card">
    <div class="image-wrapper">
      <img class="image" :src="imageSrc" loading="lazy" :alt="car.name || 'Car'" />
      <span class="category-badge">{{ car.category || 'Sedan' }}</span>
      <span class="plan-badge">{{ (car.required_plan || 'basic').toUpperCase() }}</span>
    </div>
    <div class="body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="title">{{ car.brand }} {{ car.name }}</div>
          <div class="desc">{{ car.category || 'Premium Vehicle' }}</div>
        </div>
        <div class="text-end">
          <div class="price">{{ priceLabel }}</div>
        </div>
      </div>

      <!-- Location -->
      <div class="location-badge">
        📍 {{ car.location || 'Ahmedabad, Gujarat' }}
      </div>

      <div class="mt-3 d-flex gap-2">
        <button 
          v-if="isAlreadyBooked"
          class="cs-btn-secondary w-100" 
          disabled
          title="This car is already in your subscription. Use Swap to change your car."
        >
          🔄 Swap Your Car
        </button>
        <button 
          v-else
          class="cs-btn-primary w-100" 
          :disabled="!car.available" 
          @click="$emit('subscribe', car)"
        >
          {{ car.available ? 'Request Booking' : 'Unavailable' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ 
  car: Object, 
  price: { type: [String, Number], default: null },
  subscription: Object
})

const isAlreadyBooked = computed(() => {
  if (!props.subscription) return false
  return props.car?.id === props.subscription.car?.id
})

const placeholder = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder'

const imageSrc = computed(() => {
  if (props.car?.image) {
    if (props.car.image.startsWith('http')) return props.car.image
    return `https://cardb-1.onrender.com${props.car.image}`
  }
  return placeholder
})

const priceLabel = computed(() => {
  // Try to get prices from localStorage (set by admin)
  let tierPrices = { basic: 9999, premium: 13999, luxury: 19999 }
  try {
    const saved = localStorage.getItem('tierPrices')
    if (saved) {
      tierPrices = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading tier prices:', error)
  }
  
  const carTier = (props.car?.required_plan || 'basic').toLowerCase()
  const basePrice = tierPrices[carTier] || tierPrices['basic']
  
  return `₹${basePrice}/month`
})
</script>

<style scoped>
.cs-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #ff4d30;
}

.image-wrapper {
  position: relative;
  height: 220px;
  background: linear-gradient(135deg, #f5f5f5 0%, #efefef 100%);
  overflow: hidden;
  flex-shrink: 0;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.4s ease;
}

.cs-card:hover .image {
  transform: scale(1.08);
}

.category-badge,
.plan-badge {
  position: absolute;
  top: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.category-badge {
  left: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #111;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.plan-badge {
  right: 12px;
  background: rgba(255, 77, 48, 0.92);
  color: #fff;
  border: 1px solid rgba(255, 77, 48, 0.5);
}

.body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #1a1a1a;
  margin-bottom: 4px;
  line-height: 1.3;
}

.desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 8px;
}

.price {
  font-size: 0.9rem;
  color: #ff4d30;
  font-weight: 700;
  margin-bottom: 2px;
}

.location-badge {
  font-size: 0.8rem;
  color: #d32f2f;
  margin: 10px 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.cs-btn-primary) {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  margin-top: auto;
  font-weight: 600;
  border: none;
  border-radius: 8px;
}

:deep(.cs-btn-secondary) {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  background: #f5f5f5;
  color: #888;
  border: 1px solid #ddd;
  cursor: not-allowed !important;
  opacity: 0.6;
  margin-top: auto;
  font-weight: 600;
  border-radius: 8px;
}
</style>
