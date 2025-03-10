# Authentication Module

A full-stack authentication application built with NestJS (backend) and React (frontend).

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB running locally or a MongoDB connection string (You can use the default one in the backend .env.example file, it's hosted on MongoDB Atlas)
- npm or yarn

### Backend Setup (runs on port 3000)

```bash
cd backend
npm install

# Create .env file with:
MONGODB_URI=mongodb://localhost:27017/auth-db
JWT_SECRET=your-secret-key
PORT=3000

# Start the server
npm run start:dev

# Access Swagger API documentation at:
http://localhost:3000/api

# Logs are written to:
logs/app.log
```

### Frontend Setup (runs on port 5173)

```bash
cd frontend
npm install

# Create .env file with:
# Point to the backend server (no /api prefix needed)
VITE_API_URL=http://localhost:3000

# Start the development server
npm run dev
```

## Testing

```bash
# Backend tests
cd backend
npm test
```

## API Documentation

### Swagger UI

Interactive API documentation is available at `http://localhost:3000/api` when the backend is running.

### API Endpoints

#### POST /auth/signup

Register a new user with:

- Email (valid format)
- Name (min 3 characters)
- Password (min 8 chars, 1 letter, 1 number, 1 special char)

#### POST /auth/signin

Login with email and password

### Protected Routes

All protected routes require Bearer token:

```
Authorization: Bearer your-jwt-token
```

## Security Features

- Password hashing (bcrypt)
- JWT authentication
- Rate limiting
- Input validation
- CORS enabled

## Logging

The application uses Winston for logging:

- Console output for development
- File output in `logs/app.log`
- Logs include:
  - Timestamps
  - Log levels (info, error, etc.)
  - Request details
  - Error stack traces
  - Authentication events
  - Server events

## Troubleshooting

### API Connection Issues

1. Make sure both servers are running:
   - Backend on http://localhost:3000
   - Frontend on http://localhost:5173
2. Check that VITE_API_URL points to the backend server (http://localhost:3000)
3. Verify the backend console for any CORS errors
4. If using different ports, update VITE_API_URL accordingly

### Debugging

1. Check `logs/app.log` for detailed error logs
2. Look for HTTP request/response logs to trace issues
3. Rate limiting events will be logged if too many requests are made
