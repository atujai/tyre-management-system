# Tyre Management System

A modern full-stack application for managing commercial vehicle tyres.

## Features

- **Staff Login** - JWT authentication with role-based access
- **Camera Capture** - Take photos of tyres and documents directly from the app
- **Drag & Drop** - Intuitive tyre mounting with visual drag-and-drop
- **Full Audit Trail** - Complete history of all actions
- **Image Upload** - Support for tyre photos and document uploads
- **Responsive Design** - Works on desktop and mobile

## Architecture

```
├── backend/          # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/  # Auth & upload
│   │   └── lib/      # Prisma client
│   └── prisma/       # Database schema
│
└── frontend/         # React + TypeScript + Vite
    ├── src/
    │   ├── pages/    # Page components
    │   ├── components/ui/  # Reusable UI
    │   ├── stores/   # Zustand stores
    │   └── lib/      # API client
    └── public/       # Static assets
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
npm install
# Set up .env with database URL
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tyremanager.com | admin123 |
| Staff | staff@tyremanager.com | staff123 |

## License
MIT
