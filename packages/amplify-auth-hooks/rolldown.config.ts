import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

export default defineConfig([
  {
    external: [/^node:/, /^@aws-amplify\//, /^@types\//, /^@xstate\//, /^react\//, 'react', 'react-dom', 'xstate'],
    treeshake: true,
    experimental: {
      nativeMagicString: true,
    },
    optimization: {
      inlineConst: true,
    },
    input: { index: 'src/index.ts', machines: 'src/machines/index.ts', authenticator: 'src/authenticator/index.ts' },
    output: [{ dir: 'dist', format: 'es', sourcemap: true, cleanDir: true }],
    plugins: [dts()],
  },
])
