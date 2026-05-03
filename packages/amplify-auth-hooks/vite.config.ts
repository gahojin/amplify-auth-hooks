import { mergeConfig } from 'vite'
import baseConfig from '../../vite.config.ts'

export default mergeConfig(baseConfig, {
  build: {
    lib: {
      entry: { index: 'src/index.ts', machines: 'src/machines/index.ts', authenticator: 'src/authenticator/index.ts' },
      formats: ['es'],
    },
    rolldownOptions: {
      platform: 'neutral',
      external: [/^node:/, /^@aws-amplify\//, /^@types\//, /^@xstate\//, /^react\//, 'react', 'react-dom', 'xstate'],
    },
  },
})
