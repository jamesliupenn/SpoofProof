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
- **ES Module Compatibility Fix (August 8, 2025)**: Applied comprehensive fixes for DIMO SDK deployment issues
  - Created DIMO SDK wrapper (`server/dimo-wrapper.ts`) to handle problematic directory imports
  - Updated esbuild configuration with proper external dependencies and bundling strategy
  - Implemented graceful fallback for DIMO SDK import failures with proper error messaging
  - Verified production build and server startup without ES module crashes
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
- **Real DIMO Data-SDK Integration (August 12, 2025)**: Removed mock wrapper and implemented authentic DIMO SDK
  - Replaced mock `dimo-wrapper.ts` with real `@dimo-network/data-sdk` implementation
  - Updated authentication flow to use proper `getDeveloperJwt()` and `tokenexchange.exchange()` methods
  - Implemented GraphQL queries for vehicle identity and telemetry data using actual DIMO API structure
  - Fixed vehicle location endpoint to use real JWT authentication with proper privileges [1, 3, 4]
  - All API calls now use authentic DIMO Production environment with valid API keys
  - Enhanced error handling and logging for real API interactions
- **DIMO SDK Update to v1.3.2 (August 13, 2025)**: Updated to latest DIMO data-sdk version
  - Upgraded from previous version to @dimo-network/data-sdk@1.3.2 with latest features
  - Migrated to preferred `getVehicleJwt()` function for simplified Vehicle JWT exchange
  - Maintained compatibility with existing authentication flow and API structure
  - Enhanced with latest SDK improvements including streamlined token exchange and better error handling
- **Token-Based Authentication & Caching System (August 13, 2025)**: Implemented comprehensive token caching
  - Fixed wallet address caching in localStorage using `dimo_cached_wallet_address` and `dimo_cached_token` keys
  - Updated `handleShareSuccess` to extract and cache `walletAddress` and `token` directly from authData
  - Modified API endpoints to use cached token as Bearer authorization header instead of wallet address
  - Updated `/api/dimo/vehicles` to accept token in Authorization header and walletAddress as URL parameter
  - Simplified `/api/dimo/vehicles/:id/location` to only require cached token (removed wallet parameter)
  - Enhanced storage event system for immediate UI updates after successful authentication
  - Fixed TypeScript errors and improved error handling for missing cached tokens
- **UI/UX Improvements & Spotify Integration (August 14, 2025)**: Enhanced interface and added music service integration
  - Made DIMO logo more responsive and visible (increased from h-6/h-8 to h-8/h-10)
  - Reduced "Login with DIMO" button size with smaller text (text-xs) and compact padding (px-2 py-1)
  - Installed Spotify TypeScript SDK (@spotify/web-api-ts-sdk) for music integration capabilities
  - Created comprehensive Spotify service (`server/spotify-service.ts`) with client credentials authentication
  - Implemented Spotify API test functionality searching for "The Beatles" to verify connection
  - Added `/api/spotify/test` endpoint for API validation and testing
  - Successfully tested Spotify API with full artist search results including popularity, images, and metadata
  - Removed GPS Status, GPS Controls, and Test Scenarios components for cleaner interface
  - Streamlined application to focus on vehicle location tracking and vehicle management
- **DriveTunes Rebranding & Layout Optimization (August 14, 2025)**: Complete rebrand with improved responsive design
  - Replaced DIMO branding with DriveTunes logo (DriveTunes_Logo.png) and removed old DIMO assets
  - Increased logo size by 20% with responsive scaling (h-10/h-12/h-16) and expanded header height to h-20
  - Removed subtitle and updated app title to "DriveTunes" with "Spotify playlists based on your drive" concept
  - Restructured desktop layout: 50% vehicle panel (left), 50% map (right) using lg:grid-cols-2 instead of lg:grid-cols-4
  - Added Current/Last Week buttons under each vehicle: "Current" shows current location, "Last Week" placeholder
  - Implemented clickable map pins functionality - users can click anywhere on map to drop custom red markers
  - Enhanced vehicle cards with grid layout for action buttons (Current/Last Week) with compact styling (text-xs)
- **Enhanced Map Pin System & Vehicle History Integration (August 14, 2025)**: Improved user interaction and data visualization
  - Implemented single-pin map system: only one user-dropped pin exists at a time, previous pins are automatically removed
  - Added automatic map refocusing when new pins are dropped for better user experience
  - Created GPS signal toggle: GPS dots and accuracy circles are hidden when manual pins are active
  - Connected "Current" button to clear user pins and restore GPS vehicle tracking seamlessly
  - Integrated "Last Week" button with `fetchCurrentVehicleHistory` function and `getVehicleWeeklyHistory` server endpoint
  - Added proper loading states and error handling for both current location and historical data fetching
  - Enhanced user feedback with toast notifications showing data fetch results and historical data counts
- **Spotify PKCE Authentication Integration (August 14, 2025)**: Implemented secure user-based Spotify authentication
  - Created SpotifyPlaylistGenerator component positioned under My Shared Vehicles section on left panel
  - Migrated from client credentials to Spotify PKCE (Proof Key for Code Exchange) authorization flow for enhanced security
  - Implemented complete OAuth 2.0 PKCE flow with code verifier/challenge generation using Web Crypto API
  - Added backend PKCE endpoints: `/api/spotify/config`, `/api/spotify/callback`, `/api/spotify/exchange`, `/api/spotify/profile`
  - Built user-specific Spotify client management with token caching and automatic refresh capabilities
  - Enhanced frontend with localStorage-based session persistence and automatic callback handling
  - Added proper error handling throughout authentication flow with user-friendly toast notifications
  - Updated UI to show connected state with user profile information and placeholder for future playlist generation