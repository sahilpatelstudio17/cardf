// import { createApp } from 'vue'
// import { createPinia } from 'pinia'
// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import App from './App.vue'
// import router from './router'
// import './assets/main.css'

// // Lazy load Bootstrap CSS to avoid blocking initial render
// const loadBootstrap = async () => {
//   if (!document.querySelector('link[href*="bootstrap"]')) {
//     const link = document.createElement('link')
//     link.rel = 'stylesheet'
//     link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css'
//     document.head.appendChild(link)
//   }
// }

// // Load Bootstrap after app mounts (non-blocking)
// setTimeout(() => loadBootstrap(), 0)

// const app = createApp(App)
// app.use(createPinia())
// app.use(router)
// app.config.devtools = false
// app.mount('#app')


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.css'
const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')