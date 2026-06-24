# LawMittr

Full-stack legal consultation platform with AI-powered document analysis, real-time video consultations, and a community forum.

Built as a portfolio project to demonstrate production-style architecture across React, Node.js, Python, and multiple third-party integrations.

## What it does

- **Auth & roles** — Register/login as a user, lawyer, or admin. JWT-based auth with role-gated routes and dashboards.
- **Lawyer discovery** — Browse, search, and filter lawyers by specialization, city, language, experience. View profiles with ratings and fees.
- **Appointment booking** — Pick a slot, book it. Double-booking is blocked at the database level.
- **Payments** — Razorpay integration for real payments + a demo payment mode for recruiter demos (backend-validated, clearly marked in DB).
- **Video consultation** — Peer-to-peer WebRTC calls with screen sharing, chat, mute/camera toggles, meeting timer. Signaling via Socket.IO.
- **AI document analyzer** — Upload legal PDFs, get summaries, risky clause detection, obligation extraction, plain-language explanations. Ask follow-up questions with citation-backed answers. Built with RAG (LangChain + Gemini + ChromaDB).
- **Community forum** — Create posts (anonymous or not), comment, upvote, tag by category. Moderation + reporting system.
- **Admin dashboard** — Verify lawyers, manage users, moderate forum posts, view platform analytics.

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Zod, Framer Motion |
| Backend | Node.js, Express, TypeScript, MongoDB/Mongoose, JWT, bcrypt, Socket.IO |
| AI Service | Python, FastAPI, LangChain, Gemini API, ChromaDB |
| Payments | Razorpay |
| Real-time | Socket.IO (signaling), WebRTC (peer-to-peer video) |

## Project structure

```
lawmittr/
├── frontend/           # React SPA
│   └── src/
│       ├── api/        # Axios client & API modules
│       ├── components/ # UI components + layout
│       ├── hooks/      # React Query hooks
│       ├── pages/      # Route pages & dashboards
│       ├── store/      # Zustand state
│       ├── types/      # TypeScript types
│       └── validators/ # Zod schemas
│
├── backend/            # Express REST API + Socket.IO
│   └── src/
│       ├── config/     # Env & DB config
│       ├── controllers/
│       ├── middleware/  # Auth, roles, validation, error handling
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── socket/     # WebRTC signaling
│       ├── utils/
│       └── validators/
│
└── ai-service/         # FastAPI + RAG pipeline
    ├── routers/
    ├── services/
    ├── prompts/
    └── models/
```

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Razorpay account (or use demo mode)
- Gemini API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, Razorpay keys, etc.
npm install
npm run dev             # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

### AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in GEMINI_API_KEY
uvicorn main:app --reload  # http://localhost:8000
```

## API overview

| Area | Key endpoints |
|------|--------------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Lawyers | `GET /api/lawyers`, `GET /api/lawyers/:id`, `PUT /api/lawyers/profile/me` |
| Appointments | `POST /api/appointments`, `GET /api/appointments/me`, `PATCH /api/appointments/:id/status` |
| Payments | `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/demo` |
| Meetings | `POST /api/meetings/validate`, Socket.IO room events |
| Documents | `POST /api/documents/upload`, `POST /api/documents/analyze`, `POST /api/documents/ask` |
| Forum | `GET /api/forum/posts`, `POST /api/forum/posts`, `POST /api/forum/posts/:id/comments` |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/lawyers/:id/verify`, `GET /api/admin/analytics` |

Full API reference in [API_CONTRACTS.md](./API_CONTRACTS.md).

## Roles

| Role | Access |
|------|--------|
| User | Book appointments, join video calls, upload docs for AI analysis, post in forum |
| Lawyer | Manage profile & availability, accept/reject appointments, conduct consultations |
| Admin | Verify lawyers, moderate forum, manage users, view analytics |

To create an admin: set `role: "admin"` directly on a user document in MongoDB.

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Render |
| Backend | Render |
| Database | MongoDB Atlas |
| AI Service | Render |

