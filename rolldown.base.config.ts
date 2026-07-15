import path from 'node:path'
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

export const getInputIndexFiles = (exports: Record<string, unknown>) => {
  const entries = Object.keys(exports)
    .filter((entry) => !entry.endsWith('.json'))
    .map((entry) => {
      const name = entry.replace(/^\.\/?/, '') || '.'
      const chunkName = name === '.' ? 'index' : `${name}/index`
      return [chunkName, path.resolve('src', name, 'index.ts')]
    })
  return Object.fromEntries(entries)
}

export default defineConfig({
  treeshake: {
    moduleSideEffects: false,
  },
  optimization: {
    inlineConst: true,
  },
  experimental: {
    nativeMagicString: true,
  },
  output: [{ dir: 'dist', format: 'es', sourcemap: true, cleanDir: true, comments: { jsdoc: true, legal: true } }],
  plugins: [
    dts({
      oxc: true,
    }),
  ],
})
