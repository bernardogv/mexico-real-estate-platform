# Setup Guide

This guide will help you set up the Mexico Real Estate Platform for development.

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git
- Docker (optional)

## Local Development Setup

### Clone the Repository

```bash
git clone https://github.com/bernardogv/mexico-real-estate-platform.git
cd mexico-real-estate-platform
```

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The API should now be running at http://localhost:3001

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL and other settings
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend should now be running at http://localhost:3000

## Docker Setup (Alternative)

1. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. The application should be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Environment Variables

### Backend (.env)

```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/mexico_real_estate
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## First-time Data Setup

To populate the database with initial data:

```bash
cd backend
npm run seed
```

This will create test users, properties, and other required data.

## Common Issues

- **Database Connection Issues**: Ensure PostgreSQL is running and credentials are correct
- **CORS Errors**: Check that the backend CORS settings allow your frontend origin
- **Missing Environment Variables**: Ensure all required variables are set
- **Port Conflicts**: Change ports in .env files if 3000 or 3001 are already in use
