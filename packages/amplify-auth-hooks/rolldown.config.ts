import { defineConfig } from 'rolldown'
import IsolatedDecl from 'unplugin-isolated-decl/rolldown'

export default defineConfig([
  {
    external: [/^node:/, /^@aws-amplify\//, /^@types\//, /^@xstate\//, /^react\//, 'react', 'react-dom', 'xstate'],
    treeshake: true,
    optimization: {
      inlineConst: true,
    },
    input: { index: 'src/index.ts', machines: 'src/machines/index.ts', authenticator: 'src/authenticator/index.ts' },
    output: [{ dir: 'dist', format: 'esm', entryFileNames: '[name].mjs', sourcemap: true, cleanDir: true }],
    plugins: [
      IsolatedDecl({
        transformOptions: {
          stripInternal: true,
        },
      }),
    ],
  },
])
