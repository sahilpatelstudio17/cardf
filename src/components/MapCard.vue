<template>
  <div class="map-card-section">
    <div class="section-header">
      <h2>📍 Our Locations</h2>
      <p class="location-subtitle">Service available in these areas</p>
    </div>
    
    <div class="map-container">
      <div class="map-wrapper">
        <iframe
          :src="mapUrl"
          width="100%"
          height="400"
          style="border: 0; border-radius: 12px;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      
      <div class="location-details">
        <div class="location-item">
          <div class="location-icon">📍</div>
          <div class="location-info">
            <h4>Ahmedabad Hub</h4>
            <p>Main Service Center</p>
            <a href="tel:+919876543210" class="contact-link">+91 9876543210</a>
          </div>
        </div>
        
        <div class="location-item">
          <div class="location-icon">⏰</div>
          <div class="location-info">
            <h4>Operating Hours</h4>
            <p>Monday - Sunday</p>
            <p class="time">8:00 AM - 10:00 PM</p>
          </div>
        </div>
        
        <div class="location-item">
          <div class="location-icon">✅</div>
          <div class="location-info">
            <h4>Service Coverage</h4>
            <p></p>
            <p class="coverage">Pickup Available</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Google Maps Embed API (requires API key or use generic embed)
const mapUrl = computed(() => {
  // Using OSM (OpenStreetMap) with Nominatim - no API key required
  // Coordinates for Ahmedabad, India
  const lat = 23.0225
  const lng = 72.5714
  
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lng}`
})
</script>

<style scoped>
.map-card-section {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin: 24px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.location-subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.map-container {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr;
  align-items: start;
}

.map-wrapper {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #f5f5f5;
}

.map-wrapper iframe {
  display: block;
}

.location-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  border-left: 4px solid #0066ff;
  transition: all 0.3s ease;
}

.location-item:hover {
  background: #f0f7ff;
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.1);
}

.location-icon {
  font-size: 24px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-info {
  flex: 1;
}

.location-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.location-info p {
  margin: 2px 0;
  font-size: 14px;
  color: #666;
}

.time,
.coverage {
  font-weight: 500;
  color: #0066ff;
}

.contact-link {
  display: inline-block;
  color: #0066ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.contact-link:hover {
  color: #0052cc;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .map-card-section {
    padding: 20px;
  }

  .map-container {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .location-details {
    gap: 12px;
  }

  .location-item {
    padding: 12px;
  }

  .location-info h4 {
    font-size: 14px;
  }

  .location-info p {
    font-size: 12px;
  }
}
</style>
