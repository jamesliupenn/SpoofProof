# Deployment Guide

## Production Build and Deployment

### Prerequisites
Before deploying, ensure you have:
1. Built the application for production
2. Set up static file serving correctly
3. Configured environment variables

### Building for Production

Run the production build script:
```bash
./build-production.sh
```

This script will:
1. Run `npm run build` to build both the client and server
2. Create the `server/public` directory
3. Copy static files from `dist/public` to `server/public`

### Starting the Production Server

#### Option 1: Using the startup script (Recommended)
```bash
./start-production.sh
```

#### Option 2: Manual startup
```bash
NODE_ENV=production node dist/index.js
```

### Key Deployment Fixes Applied

1. **Static File Serving**: Fixed the mismatch between build output (`dist/public`) and expected location (`server/public`)
2. **Host Binding**: Server is configured to bind to `0.0.0.0:5000` for proper interface access
3. **Production Mode**: The server correctly serves static files in production using the `serveStatic` function
4. **ES Module Compatibility**: Created DIMO SDK wrapper to handle directory import issues
5. **Custom Build Process**: Updated esbuild configuration with proper externals and bundling
6. **Graceful Fallback**: DIMO SDK wrapper provides proper error handling and fallback behavior for production deployment

### Environment Variables
- `PORT`: Server port (defaults to 5000)
- `NODE_ENV`: Set to "production" for production deployment

### File Structure
```
├── dist/
│   ├── index.js          # Built server
│   └── public/           # Built client files (Vite output)
├── server/
│   └── public/           # Static files for production serving
├── build-production.sh   # Production build script
└── package.json
```

### Troubleshooting
- If static files aren't served, ensure `server/public` exists and contains the built client files
- Verify the server is binding to `0.0.0.0` and not just `localhost`
- Check that `NODE_ENV=production` is set when running the production server