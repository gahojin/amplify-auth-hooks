import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

const getAbsolutePath = (value: string): string => {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {
      strictMode: true,
    },
  },
  stories: ['../src/**/*.stories.@(mdx|js|jsx|ts|tsx)'],
  typescript: {
    reactDocgen: 'react-docgen',
  },
  addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],
  staticDirs: ['../public'],
  core: {},
}

export default config
