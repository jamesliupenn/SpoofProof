// Deployment configuration for Node.js ES module compatibility
export const deployConfig = {
  // Node.js runtime flags for ES module compatibility
  nodeOptions: [
    '--experimental-loader=./module-loader.mjs',
    '--experimental-modules',
    '--es-module-specifier-resolution=node'
  ],
  
  // Environment variables for deployment
  environment: {
    NODE_ENV: 'production',
    NODE_OPTIONS: '--experimental-loader=./module-loader.mjs --experimental-modules --es-module-specifier-resolution=node'
  },
  
  // Build configuration
  build: {
    target: 'node18',
    format: 'esm',
    platform: 'node',
    bundle: true
  }
};