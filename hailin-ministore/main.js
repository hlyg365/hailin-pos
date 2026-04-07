<script>
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 创建Pinia实例
  const pinia = Pinia.createPinia()
  app.use(pinia)

  return {
    app,
    pinia
  }
}
</script>
