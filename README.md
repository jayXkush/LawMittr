# LawMittr

AI-powered legal consultation platform — Phase 1 (auth) + Phase 2 (lawyers & booking).

## Documentation (for AI / team handoff)

| File | Purpose |
|------|---------|
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Product vision, conventions, **paste-ready prompt for new chats** |
| [CURRENT_PROGRESS.md](./CURRENT_PROGRESS.md) | What's done per phase, gaps, next steps |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, folders, data model, flows |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | REST API request/response reference |

## Project Structure

```
lawmittr/
├── frontend/          # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── api/       # Axios client & API modules
│       ├── components/# UI (shadcn-style) + layout
│       ├── hooks/     # React Query auth hooks
│       ├── pages/     # Route pages & dashboards
│       ├── store/     # Zustand auth state
│       ├── types/     # Shared TypeScript types
│       └── validators/# Zod form schemas
│
└── backend/           # Express + TypeScript + MongoDB
    └── src/
        ├── config/    # Env & database
        ├── controllers/
        ├── middleware/# auth, roles, validation, errors
        ├── models/
        ├── routes/
        ├── utils/
        └── validators/
```

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # edit MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

### Auth (Phase 1)

| Method | Endpoint         | Auth | Description        |
|--------|------------------|------|--------------------|
| POST   | `/api/auth/register` | —  | Register (user/lawyer) |
| POST   | `/api/auth/login`    | —  | Login              |
| GET    | `/api/auth/me`       | JWT | Current user    |

### Lawyers (Phase 2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/lawyers` | — | List/search lawyers (pagination, filters) |
| GET | `/api/lawyers/:id` | — | Lawyer profile + available slots |
| GET | `/api/lawyers/profile/me` | Lawyer | Own profile |
| PUT | `/api/lawyers/profile/me` | Lawyer | Update profile |
| GET | `/api/lawyers/availability/me` | Lawyer | List own slots |
| POST | `/api/lawyers/availability/me` | Lawyer | Add slot |
| DELETE | `/api/lawyers/availability/me/:slotId` | Lawyer | Delete available slot |

### Appointments (Phase 2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments` | User | Book slot (prevents double booking) |
| GET | `/api/appointments/me?filter=upcoming\|history` | User | User appointments |
| PATCH | `/api/appointments/me/:id/cancel` | User | Cancel booking |
| GET | `/api/appointments/lawyer` | Lawyer | Lawyer appointments |
| PATCH | `/api/appointments/:id/status` | Lawyer | Confirm/complete/cancel |

| GET | `/health` | — | Health check |

## Roles

- **user** — Client dashboard (`/dashboard/user`)
- **lawyer** — Lawyer dashboard (`/dashboard/lawyer`)
- **admin** — Admin dashboard (`/dashboard/admin`) — create via DB: set `role: "admin"` on a user document

## Tech (Phase 1)

**Frontend:** React, Vite, TypeScript, Tailwind CSS v4, React Router, Axios, TanStack Query, Zustand, Zod, Framer Motion, shadcn-style UI components

**Backend:** Express, TypeScript, MongoDB/Mongoose, JWT, bcrypt, Zod validation, middleware-based architecture

## Phase 2 Flow

1. **Lawyer:** Complete profile → add availability slots in dashboard.
2. **User:** Browse `/lawyers` → filter/search → view profile → select slot → book.
3. **Lawyer:** Confirm appointments in dashboard. Double-booking is blocked via atomic slot updates.

## Next Phases

WebRTC video, AI/RAG document analysis, Razorpay payments, Socket.IO, community forum.
"# LawMittr" 
