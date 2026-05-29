# Tyre Management System - Frontend

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Zustand (State Management)
- DnD Kit (Drag & Drop)
- React Webcam (Camera Capture)
- React Dropzone (File Upload)
- Axios (HTTP Client)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will proxy API requests to `http://localhost:5000`.

## Features

### Staff Login
- JWT-based authentication
- Role-based access (Admin/Staff)
- Persistent sessions

### Camera Capture
- Take photos directly from camera
- Upload tyre serial numbers
- Document uploads
- Image optimization (WebP conversion)

### Drag & Drop
- Drag tyres from inventory to vehicle slots
- Visual feedback during drag
- Touch-friendly for mobile devices

### Dark Theme
- Professional dark UI
- Color-coded status indicators
- Responsive design

## Pages

| Page | Features |
|------|----------|
| Dashboard | Stats, stepney breakdown, recent activity |
| Vehicles | CRUD, axle configuration |
| Locations | Godowns & Retreaders management |
| Tyre Bank | Full CRUD with image upload & camera |
| Allotment | Interactive schematic with drag & drop |
| Stepney | Spare tyre management |
| History | Complete audit trail |
| Staff | User management (Admin only) |
