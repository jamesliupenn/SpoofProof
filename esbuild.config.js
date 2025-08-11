import { build } from 'esbuild';

// ESBuild configuration to handle problematic ES module dependencies
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: 'dist',
  packages: 'external', // Keep packages external but handle DIMO SDK specially
  external: [
    // Common Node.js dependencies that should stay external
    'express',
    'fs',
    'path',
    'url',
    'util',
    'os',
    'crypto',
    'stream',
    'buffer',
    'http',
    'https',
    'events',
    'zlib',
    'querystring',
    // Database and session dependencies
    '@neondatabase/serverless',
    'drizzle-orm',
    'memorystore',
    'connect-pg-simple',
    'passport',
    'passport-local',
    'express-session',
    // Problematic build tools
    'lightningcss',
    '@babel/*',
    'esbuild',
    '*.node'
    // DIMO SDK removed from external list to force bundling
  ],
  keepNames: true,
  minify: false,
  define: {
    'import.meta.url': 'import.meta.url'
  },
  conditions: ['import', 'module', 'node'],
  mainFields: ['module', 'main'],
  resolveExtensions: ['.ts', '.js', '.mjs'],
  // Handle specific problematic imports with plugins
  plugins: [{
    name: 'dimo-sdk-resolver',
    setup(build) {
      // Force bundle DIMO SDK instead of treating as external
      build.onResolve({ filter: /@dimo-network\/data-sdk/ }, args => {
        return { path: args.path, external: false };
      });
      
      // Handle problematic directory imports by redirecting to main entry
      build.onResolve({ filter: /@dimo-network\/data-sdk\/dist\/api$/ }, args => {
        return { path: '@dimo-network/data-sdk', external: false };
      });
      
      // Handle login-with-dimo package
      build.onResolve({ filter: /@dimo-network\/login-with-dimo/ }, args => {
        return { path: args.path, external: false };
      });
    }
  }]
});

console.log('Build completed successfully with ES module compatibility fixes');