/// <reference types="vitest" />
import dts from 'vite-plugin-dts';
import { joinPathFragments } from '@nx/devkit';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    emptyOutDir: true,
    outDir: '../../../dist/packages/shared/util-tests',
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'shared-util-tests',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forgot to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  cacheDir: '../../../node_modules/.vite/shared-util-tests',

  plugins: [
    ...[react(), nxViteTsPaths()],
    dts({
      entryRoot: 'src',
      tsConfigFilePath: joinPathFragments(__dirname, 'tsconfig.lib.json'),
      skipDiagnostics: true,
    }),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../../',
  //    }),
  //  ],
  // },

  test: {
    reporters: ['default'],
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      enabled: false,
      reportsDirectory: '../../../coverage/packages/shared/util-tests',
      provider: 'v8',
      // Disable coverage for this library
      include: [],
    },
  },
});
