#!/bin/bash

# Production startup script with ES module compatibility
export NODE_ENV=production

echo "Starting production server with bundled dependencies..."

# Start the production server (dependencies are now bundled by esbuild)
node dist/index.js