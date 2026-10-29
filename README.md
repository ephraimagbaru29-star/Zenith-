# Zenith Bank App

A full-stack banking application with a React frontend and Node.js/Express backend.

## Project Structure

```
Zenith/
├── backend/          # Node.js + Express API
│   ├── routes/       # auth + account routes
│   ├── middleware/   # JWT auth middleware
│   ├── data/         # In-memory user store
│   └── server.js
└── frontend/         # React + Vite app
    └── src/
        ├── pages/    # LoginPage, DashboardPage
        ├── context/  # AuthContext (JWT session)
        └── api/      # Axios instance
```

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Run the backend

```bash
cd backend
npm run dev       # with nodemon (hot reload)
# or
npm start         # plain node
```

Backend runs on **http://localhost:5000**

### 3. Run the frontend

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:5173**

## Demo Login Credentials

| Email                | Password     |
|----------------------|--------------|
| alex@zenith.com      | password123  |
| maria@zenith.com     | password123  |

## API Endpoints

| Method | Path                       | Auth     | Description              |
|--------|----------------------------|----------|--------------------------|
| POST   | /api/auth/login            | ✗        | Login, returns JWT token |
| POST   | /api/auth/logout           | ✗        | Logout confirmation      |
| GET    | /api/account/summary       | ✓ Bearer | Account balance/info     |
| GET    | /api/account/transactions  | ✓ Bearer | Transaction history      |
| GET    | /api/health                | ✗        | Health check             |
