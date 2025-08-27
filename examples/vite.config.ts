import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [],
  define: {
    'process.env': loadEnv(mode, process.cwd()),
    global: {},
  },
  server: {
    port: 5432,
  },
}))
