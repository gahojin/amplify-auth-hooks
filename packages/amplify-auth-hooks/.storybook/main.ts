import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  typescript: {
    reactDocgen: 'react-docgen',
  },
  core: {
    disableTelemetry: true,
  },
  features: {},
  framework: {
    name: '@storybook/react-vite',
    options: {
      strictMode: true,
    },
  },
}

export default config
