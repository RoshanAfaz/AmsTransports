# AMS Transports Hub - Decoupled Architecture

This repository has been decoupled into dedicated frontend and backend projects to make local running, updates, and cloud/VPS deployment straightforward.

## Directory Structure

```
├── backend/                  # Node.js + Express + MongoDB REST API server
│   ├── server.js             # API entrypoint
│   ├── package.json          # Backend-specific package scripts & dependencies
│   └── .env                  # Backend database credentials
│
└── frontend/                 # TanStack Start Single-Page & SSR Web Client
    ├── src/                  # React components, routes, and styling
    ├── public/               # Static assets & icons
    ├── package.json          # Frontend-specific build configurations
    └── tsconfig.json         # TypeScript compiler configurations
```

---

## 1. Backend Server Setup (`/backend`)

The backend is built with **Express** and connects directly to **MongoDB**.

### Running the API locally:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The server runs by default on `http://localhost:8080`.*

---

## 2. Frontend Client Setup (`/frontend`)

The frontend is built with **TanStack Start** (Vite + React + TypeScript). All API calls have been routed dynamically to the Express backend.

### Running the UI locally:
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies (if not already cached):
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Build the client bundle for production:
   ```bash
   npm run build
   ```
