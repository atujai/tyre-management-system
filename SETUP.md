# Setup Guide - Tyre Management System

## Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn**

## Step 1: Database Setup

1. Install PostgreSQL if not already installed
2. Create a database:
```sql
CREATE DATABASE tyre_management;
```

3. Create a user (optional):
```sql
CREATE USER tyre_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tyre_management TO tyre_user;
```

## Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

The backend will start on `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 4: Verify Installation

1. Open browser to `http://localhost:3000`
2. Login with demo credentials:
   - **Admin**: admin@tyremanager.com / admin123
   - **Staff**: staff@tyremanager.com / staff123

## Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or any static server
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/tyre_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
UPLOAD_DIR="uploads"
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:5000/api"
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check connection string in `.env`
- Ensure database exists: `psql -l | grep tyre_management`

### Port Conflicts
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`

### Image Upload Issues
- Ensure `uploads/` directory exists and is writable
- Check file size limits (default: 10MB)
- Supported formats: JPEG, PNG, WebP, PDF

## API Documentation

All API endpoints require authentication via Bearer token in the `Authorization` header.

### Authentication
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "token": "...", "user": { ... } }
```

### Vehicles
```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
```

### Tyres
```
GET    /api/tyres?status=&locationId=&search=
GET    /api/tyres/:id
POST   /api/tyres (multipart/form-data with images)
PUT    /api/tyres/:id (multipart/form-data with images)
DELETE /api/tyres/:id
```

### Allotment
```
POST /api/allotment/mount
Body: { "tyreId", "vehicleId", "axleId", "position" }

POST /api/allotment/unmount
Body: { "tyreId", "destination", "locationId?", "targetVehicleId?", "stepneyType?", "withRim?" }

POST /api/allotment/rotate
Body: { "tyreId1", "tyreId2" }

POST /api/allotment/bulk-mount
Body: { "vehicleId" }
```

## Support

For issues or questions, please refer to the README files in each directory.
