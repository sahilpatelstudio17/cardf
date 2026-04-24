<template>
  <div class="notfound-page">
    <div class="notfound-content">
      <p class="code">404</p>
      <h1>Page Not Found</h1>
      <p class="message">The page you are looking for does not exist or the URL is incorrect.</p>
      <div class="actions">
        <router-link to="/" class="cs-btn-primary">Go Home</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fb 0%, #eef1f7 100%);
}

.notfound-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  text-align: center;
}

.code {
  font-size: clamp(4rem, 14vw, 8rem);
  font-weight: 800;
  line-height: 1;
  color: #ff4d30;
  margin: 0 0 0.75rem;
}

h1 {
  font-size: clamp(1.75rem, 4.5vw, 2.4rem);
  color: #111;
  margin-bottom: 0.75rem;
}

.message {
  color: #60646f;
  font-size: 1.02rem;
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>