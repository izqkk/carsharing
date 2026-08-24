import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useI18n } from './i18n'
import { APP_NAME } from './lib/app-config'
import App from './App.vue'
import './style.css'

// The document title and <html lang> live outside the Vue tree, so they are
// set here rather than in a component.
document.title = APP_NAME
document.documentElement.lang = useI18n().locale.value

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

// Mount only once the session is known, so the router guard never has to
// decide between "logged out" and "not loaded yet" on the very first render.
authStore.init().then(() => {
  app.mount('#app')
})
