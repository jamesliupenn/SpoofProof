# GPS Signal Visualizer

## Overview

This is a GPS Signal Visualizer application that provides real-time GPS accuracy mapping with interactive controls. The application allows users to visualize GPS signals with adjustable coordinates and HDOP (Horizontal Dilution of Precision) values, displaying accuracy circles on an interactive map using Leaflet. Users can input GPS coordinates manually or select from predefined test scenarios representing different signal conditions (vehicle offline, urban garage, open road, etc.).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application built with React 18 and TypeScript for type safety
- **Vite**: Modern build tool for fast development and optimized production builds
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Server state management for API calls and caching
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Leaflet**: Interactive mapping library for GPS visualization

### Backend Architecture  
- **Express.js**: Node.js web framework serving REST API endpoints
- **TypeScript**: Type-safe server-side development
- **In-memory storage**: Simple storage implementation using Maps for development/testing
- **Drizzle ORM**: Database ORM configured for PostgreSQL (schema defined but using memory storage currently)

### Component Structure
- **GPS Controls**: Input forms for latitude, longitude, and HDOP values with test scenario buttons
- **GPS Map**: Interactive Leaflet map displaying GPS coordinates with accuracy circles
- **GPS Status**: Status indicator showing signal quality based on HDOP values (No GPS, Poor GPS, Good GPS)

### API Endpoints
- `POST /api/gps`: Save new GPS data
- `GET /api/gps/latest`: Retrieve the most recent GPS reading  
- `GET /api/gps`: Retrieve all GPS data
- `GET /api/gps/test-scenarios`: Get predefined test scenarios

### Data Models
- **GPS Data**: Contains latitude, longitude, HDOP value, and timestamp
- **User**: Basic user structure with username and password (prepared for future authentication)

### Development Features
- **Hot Module Replacement**: Fast development with Vite HMR
- **Runtime Error Overlay**: Development error handling
- **TypeScript Path Mapping**: Organized imports with @ aliases

## External Dependencies

### Core Technologies
- **Node.js**: JavaScript runtime environment
- **PostgreSQL**: Database system (configured via Drizzle but not actively used)
- **Neon Database**: Serverless PostgreSQL provider (connection configured)
- **DIMO SDK**: Vehicle data integration with ES module compatibility wrapper

### Frontend Libraries  
- **Radix UI**: Headless component primitives for accessible UI components
- **Leaflet**: Open-source mapping library for interactive maps
- **React Hook Form**: Form handling with validation
- **date-fns**: Date manipulation utilities
- **Zod**: Schema validation for type-safe data parsing

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **Drizzle Kit**: Database migration and schema management tools

### Maps and Tiles
- **OpenStreetMap**: Tile provider for map visualization
- **Leaflet CDN**: External CSS and marker icons

### Session Management
- **connect-pg-simple**: PostgreSQL session store (configured for future use)

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

### Recent Changes (August 2025)
- Fixed deployment configuration issues preventing production builds from serving static files correctly
- Created production build script that properly handles file structure requirements
- Verified host binding and port configuration for deployment compatibility
- **ES Module Compatibility Issue (August 8, 2025)**: Identified DIMO SDK deployment compatibility issues
  - DIMO SDK data-sdk package has ES module import conflicts that cannot be bypassed
  - Removed wrapper implementation as it could not resolve underlying ES module structure issues
  - Direct DIMO SDK usage maintained for core vehicle querying functionality
- **DIMO Token Exchange Integration (August 8, 2025)**: Implemented complete DIMO authentication and vehicle telemetry flow
  - Added DIMO Identity API integration to query vehicles shared with app's Client ID using GraphQL
  - Implemented Developer JWT and Vehicle JWT token exchange using getDeveloperJwt and getVehicleJwt functions
  - Created real-time vehicle location endpoint using DIMO Telemetry API with signalsLatest GraphQL query
  - Built frontend UserVehicles component showing shared vehicles with permissions and location fetch buttons
  - Integrated vehicle location data directly into GPS visualization system for seamless map updates
  - Added proper error handling for missing vehicles, invalid tokens, and API failures
  - Configured DIMO_API_KEY environment variable for secure authentication with DIMO services
- **API Endpoint Correction (August 8, 2025)**: Fixed vehicle fetching API to use proper GraphQL query format
  - Corrected API endpoint from /api/dimo/shared-vehicles to /api/dimo/vehicles with Authorization Bearer token
  - Updated getUserVehicles function to use Identity API GraphQL query with filterBy: { privileged, owner }
  - Fixed service layer to properly query vehicles owned by user and privileged to DIMO Client ID
  - Successfully verified API returns user's 2 vehicles: Toyota Camry 2025 (tokenId 180895), Lexus NX 2021 (tokenId 117315)
- **JWT Caching & Expiration Management (August 8, 2025)**: Implemented comprehensive JWT lifecycle management
  - Added Developer JWT caching with 14-day expiration (cached for 13 days with 1-hour safety margin)
  - Added Vehicle JWT caching with 10-minute expiration (cached for 9 minutes with 1-minute safety margin)
  - Implemented automatic JWT cleanup every 5 minutes to remove expired tokens
  - Added try-catch blocks for JWT failures with automatic cache invalidation on errors
  - Optimized API performance by reusing valid cached JWTs instead of fetching new ones unnecessarily
- **Wallet Address Caching & Persistent Auth (August 8, 2025)**: Implemented authentication state persistence
  - Created `useCachedDimoAuth` hook to manage wallet address caching in localStorage
  - Authentication persists across browser sessions and page reloads using cached wallet address
  - Automatic cache invalidation when user explicitly logs out via LogoutWithDimo component
  - Visual indicators show when authentication is from cache vs. live DIMO SDK state
  - Seamless integration with existing vehicle query system - cached auth enables vehicle display
  - Cache keys: `dimo_cached_wallet_address` and `dimo_cached_email` stored in localStorage
- **DIMO Wrapper Removal (August 11, 2025)**: Removed DIMO SDK wrapper due to unresolvable ES module issues
  - Removed `server/dimo-wrapper.ts` file that attempted to bypass data-sdk compatibility problems
  - Updated routes to use direct `DimoService` class instantiation from `server/dimo-service.ts`
  - Mock implementations added to location, data, and telemetry endpoints while resolving SDK integration
  - Core vehicle authentication and listing functionality maintained through direct SDK usage
- **Authentic DIMO SDK Integration Completed (August 11, 2025)**: Successfully implemented real DIMO SDK with ES Next Module support
  - Removed all mock implementations and restored authentic DIMO data-sdk integration
  - Backend server successfully initializing with authentic DIMO SDK using TypeScript ES Next Module
  - Proper JWT token exchange flow: Developer JWT (14-day cache) → Vehicle JWT (10-minute cache) → Telemetry data
  - Real-time vehicle location fetching via DIMO Telemetry API GraphQL queries
  - Vehicle data querying via DIMO Identity API with proper authentication
  - Frontend-backend communication architecture ready for wallet address transmission and Vehicle JWT generation
  - Backend working correctly with all DIMO environment variables properly configured