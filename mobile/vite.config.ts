import { defineConfig, transformWithEsbuild, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// React Native platform extensions. `.web.*` are resolved first so that any
// module with a web-specific implementation (native fallbacks) wins over the
// mobile (Android/iOS) source. This is the same mechanism Metro uses on native.
const extensions = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
  '.json',
];

// Several React Native packages publish untranspiled JSX inside `.js` files.
// Vite's dependency pre-bundler handles this in dev (via optimizeDeps loaders)
// but the production Rollup build does not, so we transform those files with
// esbuild's JSX loader here. Scoped to the RN ecosystem to keep it fast.
const RN_JSX_PACKAGES =
  /node_modules[\\/](react-native-[^\\/]+|@react-native[^\\/]*|@react-navigation)[\\/]/;

function reactNativeJsx(): Plugin {
  return {
    name: 'react-native-web-jsx',
    enforce: 'pre',
    async transform(code, id) {
      const file = id.split('?')[0];
      if (!/\.(js|jsx)$/.test(file)) return null;
      if (!RN_JSX_PACKAGES.test(file)) return null;
      const result = await transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      });
      return { code: result.code, map: result.map };
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    root: __dirname,
    // Serve `public/` (fonts, etc.) at the site root.
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [
      reactNativeJsx(),
      react({
        // Transform JSX in .js files coming from React Native packages.
        babel: {
          babelrc: false,
          configFile: false,
        },
      }),
    ],
    define: {
      // React Native / react-native-web rely on these globals.
      global: 'window',
      __DEV__: JSON.stringify(!isProd),
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development',
      ),
    },
    resolve: {
      extensions,
      alias: [
        // The core of the RN -> Web bridge.
        { find: /^react-native$/, replacement: 'react-native-web' },
        // Mobile-only Sentry SDK -> web-safe shim backed by @sentry/react.
        {
          find: '@sentry/react-native',
          replacement: path.resolve(__dirname, 'src/platform/sentry.web.ts'),
        },
        // NetInfo has no first-class web build in this version; the type-only
        // import in the store is erased, so point it at an empty stub to keep
        // the bundler from trying to resolve native code.
        {
          find: '@react-native-community/netinfo',
          replacement: path.resolve(
            __dirname,
            'src/platform/stubs/netinfo.web.ts',
          ),
        },
      ],
    },
    optimizeDeps: {
      // react-native-web ships ESM; a few RN deps ship untranspiled JSX in .js.
      esbuildOptions: {
        resolveExtensions: extensions,
        loader: { '.js': 'jsx' },
        jsx: 'automatic',
      },
      include: ['react-native-web', 'react', 'react-dom'],
    },
    build: {
      outDir: path.resolve(__dirname, 'dist-web'),
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        treeshake: true,
        output: {
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          entryFileNames: 'assets/entry/[name]-[hash].js',
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }

            if (
              id.includes('/react-native-web/') ||
              id.includes('/react-native/') ||
              id.includes('/@react-navigation/')
            ) {
              return 'vendor-rn';
            }

            if (id.includes('/@tanstack/react-query/')) {
              return 'vendor-query';
            }

            if (id.includes('/@sentry/')) {
              return 'vendor-sentry';
            }

            // Let Rollup decide for the rest to avoid circular manual chunk edges.
            return;
          },
        },
      },
    },
    server: {
      port: 3002,
      open: false,
    },
  };
});
