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