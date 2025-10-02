# Topping Express - Shipping Quote System

## Overview
A full-stack shipping quote and order management system for Canada-to-USA shipments. Built with React, TypeScript, Vite (frontend) and Express, Node.js (backend).

## Recent Changes
- **2025-10-02**: Configured for Replit and Render deployment
  - Updated Vite config to bind to 0.0.0.0:5000 with HMR over WSS
  - Added `allowedHosts: true` to Vite config for Replit proxy compatibility
  - Configured backend server to run on localhost:3000
  - Set up concurrent development servers (frontend + backend)
  - Fixed build script to use `npx vite build` for reliable production builds
  - Updated render.yaml to install devDependencies during build phase
  - Configured deployment for autoscale with proper build configuration

## Project Architecture

### Tech Stack
- **Frontend**: React 18.3.1, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend**: Express 4.21.2, Node.js
- **Database**: PostgreSQL (via Replit database or DATABASE_URL env var)
- **Email**: Postmark (optional, requires postmark_API_Tokens env var)
- **Shipping API**: Stallion Express (requires STALLION_API_TOKEN env var)

### Directory Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Express backend
│   ├── index.js         # Main server file
│   └── public/          # Built frontend (generated)
└── shared/              # Shared schemas and types
    └── schema.ts
```

### Development Setup

#### Ports
- **Frontend (Vite)**: 0.0.0.0:5000 (user-facing)
- **Backend (Express)**: localhost:3000 (API only)
- **Proxy**: Vite proxies `/api/*` requests to backend

#### Environment Variables
Required for full functionality:
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `STALLION_API_TOKEN`: Stallion Express API token for shipping quotes
- `postmark_API_Tokens`: Postmark API token for email notifications
- `ADMIN_EMAIL`: Admin email for order notifications (optional, defaults to toppingcourier.ca@gmail.com)

#### Running the App
- **Development**: `npm run dev` (runs both frontend and backend concurrently)
- **Build**: `npm run build` (builds frontend to server/public/)
- **Production**: `npm start` (serves built frontend + API from Express)

### Database
- Uses PostgreSQL with direct SQL queries (not ORM in server code)
- Auto-creates `orders` table on startup if missing
- Falls back to mock data if database unavailable

### API Integration
- **Stallion Express API**: Used for real-time shipping quotes and order creation
- Handles postal code formatting for CA/US addresses
- Supports multiple carriers (FedEx, UPS, ICS, etc.)

### Email Service
- **Postmark**: Sends order confirmation emails to customers and admins
- Gracefully degrades if API token not available
- Beautiful HTML email templates included

## User Preferences
None specified yet.

## Deployment
- **Type**: Autoscale (stateless, ideal for web applications)
- **Build**: `npm run build` (compiles Vite frontend)
- **Run**: `npm start` (Express serves both API and static files)
- **Port**: Backend binds to PORT env var (defaults to 10000 in production)
