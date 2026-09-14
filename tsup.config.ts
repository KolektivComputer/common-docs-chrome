import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/core/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  external: ['@kolektiv/themes', '@kolektiv/themes/shiki'],
});
