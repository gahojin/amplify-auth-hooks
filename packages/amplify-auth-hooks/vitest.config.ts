import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          include: ['**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules', '**/*.browser.{test,spec}.{ts,tsx}'],
          name: 'unit',
          environment: 'jsdom',
        },
      },
    ],
    setupFiles: ['./.storybook/vitest.setup.ts', '../../vitest.setup.ts'],
  },
})
