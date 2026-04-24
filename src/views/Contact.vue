<template>
 <!-- Contact Section -->
    <section id="contact" class="contact_section py-5 bg-light">
      <div class="container">
        <h2 class="text-center mb-5">Contact <span style="color: #fe5b29;">Us</span></h2>
        <div class="row">
          <div class="col-md-6 mx-auto">
            <form @submit.prevent="submitContact">
              <div class="mb-3">
                <input v-model="contactForm.name" type="text" class="form-control" placeholder="Your Name" required>
              </div>
              <div class="mb-3">
                <input v-model="contactForm.email" type="email" class="form-control" placeholder="Your Email" required>
              </div>
              <div class="mb-3">
                <textarea v-model="contactForm.message" class="form-control" rows="5" placeholder="Your Message" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary w-100">Send Message</button>
              <p v-if="contactSubmitted" class="alert alert-success mt-3 mb-0 text-center">
                Thank you! Your message has been sent.
              </p>
              <p v-if="contactError" class="alert alert-danger mt-3 mb-0 text-center">
                {{ contactError }}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { contactAPI } from '../services/api'

const contactForm = ref({
  name: '',
  email: '',
  message: ''
})

const contactSubmitted = ref(false)
const contactError = ref('')

const submitContact = async () => {
  contactError.value = ''

  try {
    await contactAPI.submitWithN8n(
      contactForm.value.name,
      contactForm.value.email,
      contactForm.value.message
    )

    contactSubmitted.value = true
    contactForm.value = { name: '', email: '', message: '' }

    window.setTimeout(() => {
      contactSubmitted.value = false
    }, 5000)
  } catch (error) {
    console.error('Contact form submission failed:', error)
    contactError.value = 'Failed to send your message. Please try again.'
  }
}

</script>

<style scoped>

</style>
