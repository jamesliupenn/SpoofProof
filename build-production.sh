#!/bin/bash

# Build the frontend
vite build

# Build the backend with ES module compatibility fixes
node esbuild.config.js

# Create the server/public directory if it doesn't exist
mkdir -p server/public

# Copy the built files to the expected location
cp -r dist/public/* server/public/

echo "Production build complete with ES module compatibility fixes. Static files are now in server/public/"