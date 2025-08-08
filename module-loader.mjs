// Module loader to handle ES module compatibility issues
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Custom resolve hook to handle problematic DIMO SDK imports
export async function resolve(specifier, context, nextResolve) {
  // Handle DIMO SDK directory imports by redirecting to main entry
  if (specifier.includes('@dimo-network/data-sdk/dist/api')) {
    try {
      // Try to resolve to main entry point instead of directory
      const mainEntry = specifier.replace('/dist/api', '/dist/index.js');
      return nextResolve(mainEntry, context);
    } catch (error) {
      // Fall back to package.json main field
      return nextResolve('@dimo-network/data-sdk', context);
    }
  }
  
  // For other DIMO network packages, ensure proper resolution
  if (specifier.startsWith('@dimo-network/')) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // Try resolving without specific path
      const packageName = specifier.split('/').slice(0, 2).join('/');
      return nextResolve(packageName, context);
    }
  }
  
  return nextResolve(specifier, context);
}

// Load hook to handle module format issues
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  
  // Ensure ES module format for DIMO SDK
  if (url.includes('@dimo-network/')) {
    return {
      ...result,
      format: 'module'
    };
  }
  
  return result;
}