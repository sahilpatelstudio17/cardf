<template>
  <div class="about-page">
    <div class="container py-5">
      <h1 class="page-title mb-4">About Us</h1>
      
      <div class="about-content">
        <section class="mb-5">
          <h2>Welcome to CarSwap</h2>
          <p>CarSwap is a revolutionary car subscription and swapping platform that gives you the freedom to drive the car you want, when you want it. Say goodbye to long-term commitments and hello to flexible mobility.</p>
        </section>

        <section class="mb-5">
          <h2>Our Mission</h2>
          <p>We believe car ownership should be simple, flexible, and stress-free. Our mission is to transform how people access vehicles by offering subscription-based plans that let you swap cars based on your changing needs and lifestyle.</p>
        </section>

        <section class="mb-5">
          <h2>Why Choose CarSwap?</h2>
          <div class="row">
            <div class="col-md-4 mb-3">
              <div class="feature-card p-3">
                <h4>Flexibility</h4>
                <p>Swap your car whenever your needs change - whether it's a weekend getaway or a daily commute.</p>
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <div class="feature-card p-3">
                <h4>No Hidden Costs</h4>
                <p>Insurance, maintenance, and roadside assistance included in your subscription.</p>
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <div class="feature-card p-3">
                <h4>Quality Vehicles</h4>
                <p>Access to a curated fleet of well-maintained, quality vehicles.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Our Team</h2>
          <p>We're a passionate team of automotive enthusiasts and tech innovators dedicated to making car access easier for everyone.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.about-page {
  min-height: calc(100vh - 80px);
  background: #f8f9fa;
}

.page-title {
  color: #333;
  font-weight: 700;
}

.about-content h2 {
  color: #444;
  margin-bottom: 1rem;
}

.about-content p {
  color: #666;
  line-height: 1.8;
}

.feature-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
}

.feature-card h4 {
  color: #333;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.95rem;
  margin-bottom: 0;
}
</style>
