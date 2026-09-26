import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [vue(), tailwindcss()],
    base: command === 'build' ? '/tahvel-tunniplaan/' : '/'
  }
});
