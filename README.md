# SpoofProof
![GitHub Repo stars](https://img.shields.io/github/stars/dimo-network/data-sdk?label=data-SDK)
![GitHub Repo stars](https://img.shields.io/github/stars/dimo-network/login-with-dimo?label=LoginWithDIMO)

## Overview

SpoofProof is an app that integrates [Login with DIMO](https://www.npmjs.com/package/@dimo-network/login-with-dimo) and [DIMO Data SDK](https://www.npmjs.com/package/@dimo-network/data-sdk) to validate 3 things:
1. User access to vehicle
2. Location of vehicle
3. VIN of vehicle

## Deployment Configuration

### Production Build Process
- **Build Script**: Custom `build-production.sh` script handles complete production build
- **Static File Serving**: Fixed file path mismatch between build output (`dist/public`) and server expectations (`server/public`)
- **Host Binding**: Server configured to bind to `0.0.0.0:5000` for proper interface access
- **Environment Detection**: Automatic switching between development (Vite HMR) and production (static file serving) modes

### Build Output Structure
```
├── dist/
│   ├── index.js          # Bundled server (ESBuild)
│   └── public/           # Client build output (Vite)
├── server/
│   └── public/           # Production static files location
```

### Deployment Requirements
- Node.js runtime environment
- Environment variable `NODE_ENV=production`
- Port configuration via `PORT` environment variable (defaults to 5000)
- Static files must be properly copied to `server/public` before starting production server
