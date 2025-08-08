#!/bin/bash

# Build the application
npm run build

# Create the server/public directory if it doesn't exist
mkdir -p server/public

# Copy the built files to the expected location
cp -r dist/public/* server/public/

echo "Production build complete. Static files are now in server/public/"