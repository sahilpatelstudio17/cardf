<template>
  <div class="card p-3 m-2 text-center">
    <h4>{{ plan.name }}</h4>
    <p>₹ {{ plan.price }} / month</p>
    <button class="btn btn-success" @click="$emit('select', plan)">
      Select Plan
    </button>
  </div>
</template>

<script setup>
defineProps(['plan'])
</script>
