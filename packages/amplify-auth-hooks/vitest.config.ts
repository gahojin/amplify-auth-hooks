import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          include: ['**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules', '**/*.browser.{test,spec}.{ts,tsx}'],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          globals: true,
          include: ['**/*.browser.{test,spec}.{ts,tsx}'],
          name: 'browser',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    setupFiles: ['./.storybook/vitest.setup.ts', '../../vitest.setup.ts'],
  },
})
