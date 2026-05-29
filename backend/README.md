# Tyre Management System - Backend

## Tech Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Multer + Sharp (Image Upload & Processing)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database and update `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/tyre_management?schema=public"
JWT_SECRET="your-secret-key"
PORT=5000
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Seed database:
```bash
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register (Admin only)
- GET `/api/auth/me` - Get current user
- GET `/api/auth/users` - List users (Admin only)
- PATCH `/api/auth/users/:id/toggle` - Toggle user active status

### Vehicles
- GET `/api/vehicles` - List all vehicles
- GET `/api/vehicles/:id` - Get vehicle details
- POST `/api/vehicles` - Create vehicle
- PUT `/api/vehicles/:id` - Update vehicle
- DELETE `/api/vehicles/:id` - Delete vehicle

### Locations
- GET `/api/locations` - List locations
- POST `/api/locations` - Create location
- PUT `/api/locations/:id` - Update location
- DELETE `/api/locations/:id` - Delete location

### Tyres
- GET `/api/tyres` - List tyres (with filters)
- GET `/api/tyres/:id` - Get tyre details
- POST `/api/tyres` - Create tyre (with images)
- PUT `/api/tyres/:id` - Update tyre
- DELETE `/api/tyres/:id` - Delete tyre
- DELETE `/api/tyres/:id/images/:imageId` - Delete tyre image

### Allotment
- POST `/api/allotment/mount` - Mount tyre
- POST `/api/allotment/mount-from-retreader` - Mount from retreader
- POST `/api/allotment/unmount` - Unmount tyre
- POST `/api/allotment/rotate` - Rotate two tyres
- POST `/api/allotment/bulk-mount` - Quick fill
- POST `/api/allotment/unmount-all` - Unmount all
- POST `/api/allotment/stepney/assign` - Assign stepney
- POST `/api/allotment/stepney/return` - Return to inventory
- POST `/api/allotment/stepney/mount` - Mount stepney to axle

### History
- GET `/api/history` - List history
- DELETE `/api/history/clear` - Clear history

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics
