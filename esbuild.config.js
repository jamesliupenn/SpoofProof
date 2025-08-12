import { build } from 'esbuild';

// ESBuild configuration to handle problematic ES module dependencies
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
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
  ],
  // Force bundling of DIMO SDK to resolve ES module issues
  packages: 'external',
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
      // Handle the problematic directory import
      build.onResolve({ filter: /@dimo-network\/data-sdk\/dist\/api$/ }, args => {
        return { path: '@dimo-network/data-sdk', external: false };
      });
    }
  }]
});

console.log('Build completed successfully with ES module compatibility fixes');