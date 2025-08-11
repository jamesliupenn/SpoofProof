#!/bin/bash

# Production start script using CommonJS format to avoid ES module issues
echo "Starting production server with CommonJS format..."

# Build the application using CommonJS format
echo "Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed! Please check the build logs."
    exit 1
fi

# Copy static files to server public directory
echo "Copying static files..."
if [ -d "dist/public" ]; then
    rm -rf server/public/*
    cp -r dist/public/* server/public/
    echo "Static files copied successfully"
else
    echo "Warning: No dist/public directory found"
fi

# Start the production server
echo "Starting production server..."
NODE_ENV=production node dist/index.js

echo "Production server started successfully"