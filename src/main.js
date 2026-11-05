import { createSSRApp } from 'vue'
import App from './App.vue'
import { bootstrap } from './store/index.js'

export function createApp() {
  const app = createSSRApp(App)
  bootstrap()
  return { app }
}
