import { defineConfig } from 'rolldown'
import IsolatedDecl from 'unplugin-isolated-decl/rolldown'

export default defineConfig([
  {
    external: [/^node:/, /^@aws-amplify\//, /^@types\//, /^@xstate\//, /^react\//, 'react', 'react-dom', 'xstate'],
    treeshake: true,
    input: 'src/index.ts',
    output: [{ format: 'esm', entryFileNames: '[name].mjs', sourcemap: true }],
    plugins: [
      IsolatedDecl({
        transformOptions: {
          stripInternal: true,
        },
      }),
    ],
  },
])
