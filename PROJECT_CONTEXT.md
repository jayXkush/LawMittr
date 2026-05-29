# LawMittr — Project Context

> **Handoff prompt for new Cursor chats** — paste this block at the start of a session:
>
> ```
> I'm building LawMittr, a full-stack AI-powered legal consultation platform.
> Read these docs first (in order): PROJECT_CONTEXT.md, CURRENT_PROGRESS.md, ARCHITECTURE.md, API_CONTRACTS.md.
> Work phase-by-phase only — do NOT implement future phases unless I ask.
> Completed: Phase 1 (auth + RBAC), Phase 2 (lawyers + appointments), Phase 3 (Razorpay + demo payments), Phase 4 (WebRTC video + Socket.IO), Phase 5 (AI/RAG analyzer), Phase 6 (community forum).
> Not built yet: admin APIs (Phase 7).
> Stack: React/Vite/TS/Tailwind frontend, Express/TS/MongoDB backend.
> Follow existing folder structure, Zod validation, JWT middleware, React Query + Zustand patterns.
> Keep diffs minimal; match existing code style.
> ```

---

## Vision

**LawMittr** connects clients with verified lawyers for secure consultations, AI-powered document analysis, community discussions, and paid appointments.

## Monorepo layout

```
lawmittr/
├── frontend/                 # React + Vite + TypeScript + Tailwind v4
├── backend/                  # Node.js + Express + TypeScript + MongoDB
├── PROJECT_CONTEXT.md        # This file — product + conventions
├── CURRENT_PROGRESS.md       # What's done vs planned per phase
├── ARCHITECTURE.md           # System design, data flow, folder rules
├── API_CONTRACTS.md          # REST API request/response shapes
└── README.md                 # Quick start (setup commands)
```

## Tech stack (target vs implemented)

| Layer | Planned | Status |
|-------|---------|--------|
| Frontend | React, Vite, TS, Tailwind, React Router, Axios, React Query, Zustand, ShadCN-style UI, Framer Motion, Zod | ✅ Phase 1–6 |
| Backend | Express, TS, REST, JWT, bcrypt, Zod, middleware | ✅ Phase 1–6 |
| Database | MongoDB Atlas / local | ✅ |
| Payments | Razorpay (real) + backend-validated demo mode | ✅ Phase 3 |
| Email | Nodemailer (optional SMTP on payment confirm) | ✅ Phase 3 |
| Real-time | Socket.IO + WebRTC | ✅ Phase 4 |
| AI | Python FastAPI + LangChain + RAG + FAISS (with Gemini/Groq providers) | ✅ Phase 5 |
| Deploy | Vercel (FE), Render/Railway (BE) | ❌ Not configured |

## User roles

| Role | Registration | Dashboard route |
|------|--------------|-----------------|
| `user` | Public signup | `/dashboard/user` |
| `lawyer` | Public signup (creates `LawyerProfile` on register) | `/dashboard/lawyer` |
| `admin` | Manual DB only (`role: "admin"` on User) | `/dashboard/admin` (placeholder UI) |

## Development conventions

### Backend

- Entry: `backend/src/server.ts` → `app.ts` → routes under `/api`
- **Controllers** handle HTTP; **services** hold reusable domain logic (`lawyer.service.ts`, `payment.service.ts`, `email.service.ts`, `forum.service.ts`)
- **Validators** in `validators/` use Zod; applied via `validate()` middleware
- Errors: throw `AppError(message, statusCode)`; caught by `error.middleware.ts`
- Async routes wrapped with `asyncHandler()`
- Auth: `Authorization: Bearer <jwt>`; `req.user` set by `authenticate` middleware; `optionalAuthenticate` for public routes that enrich responses when JWT is present (forum read)
- Roles: `authorize('user' | 'lawyer' | 'admin')` middleware
- Env validated at startup in `config/env.ts` (Zod); loads `backend/.env` via explicit path; copy `backend/.env.example` → `.env`
- `JWT_SECRET` must be ≥ 32 characters
- **Save `.env` to disk** after edits — unsaved editor buffer will not be read by the server
- Razorpay webhook route uses `express.raw()` **before** `express.json()` in `app.ts`

### Frontend

- Path alias: `@/` → `frontend/src/`
- API base: `VITE_API_URL` (default `http://localhost:5000/api`)
- Auth token in Zustand (`store/authStore.ts`), persisted as `lawmittr-auth`
- Axios interceptor attaches JWT; 401 clears auth
- Data fetching: TanStack React Query; mutations for writes
- UI: shadcn-**style** components in `components/ui/` (not full ShadCN CLI)
- Pages in `pages/`; shared layout in `components/layout/`
- Razorpay Checkout: script loaded dynamically on payment page (`window.Razorpay`)

### General rules for future phases

1. **One phase per request** — user will say "Phase N"; don't scaffold everything at once
2. **Modular APIs** — new domain → new `*.routes.ts`, `*.controller.ts`, `models/`, `api/*.api.ts`
3. **Environment variables** for all secrets and URLs
4. **Mobile-responsive** UI; dashboard-style professional look
5. **Do not commit** `.env` files
6. **Demo payment** must always go through backend (`POST /payments/demo`) — never fake success in frontend only

## Local development

```bash
# Terminal 1
cd backend && npm run dev    # http://localhost:5000

# Terminal 2
cd frontend && npm run dev   # http://localhost:5173 (proxies /api in vite.config)

# Optional: seed demo lawyer for testing
cd backend && npm run seed:demo-lawyer
# Undo: npm run seed:demo-lawyer:remove
```

## Planned phases (roadmap)

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Auth, JWT, RBAC, landing/login/signup, dashboards shell | ✅ Done |
| 2 | Lawyer profiles, search, availability, appointments, double-booking prevention | ✅ Done |
| 3 | Razorpay payments, demo payment mode, meeting credentials, confirmation email | ✅ Done |
| 4 | WebRTC video consultation + Socket.IO signaling | ✅ Done |
| 5 | AI legal document analyzer (RAG, FastAPI service) | ✅ Done |
| 6 | Community forum (posts, comments, upvotes, anonymous posting) | ✅ Done |
| 7 | Admin dashboard APIs (moderation, lawyer verification) | 🔲 Planned |

See **CURRENT_PROGRESS.md** for file-level detail and known gaps.

## Key domain concepts

- **User** — auth identity (`User` model)
- **LawyerProfile** — 1:1 with lawyer `User`; public listing fields; `userId` in API responses is always the **User** id (for `/lawyers/:id`)
- **AvailabilitySlot** — bookable time; `available` → `booked` atomically on booking
- **Appointment** — links client + lawyer + slot
  - Status: `pending` → `confirmed` (after payment) → `completed` / `cancelled`
  - Payment: `paymentStatus` (`pending` | `paid` | `failed`), `paymentMode` (`real` | `demo`)
  - After confirm: `meetingId`, `meetingPassword` (for video consult; shown in UI + email)
- **ForumPost** — community discussion; `authorId`, optional `isAnonymous`, `category`, `tags`, denormalized `upvotesCount` / `commentsCount`
- **ForumComment** — reply on a post; increments post `commentsCount`
- **ForumVote** — one upvote per user per post (unique index); toggled via POST/DELETE vote routes

## Appointment + payment flow (Phase 3)

```
Book slot → appointment pending + payment pending
    → /appointments/:id/payment
    → Razorpay checkout OR POST /payments/demo (if enabled)
    → backend verifies → status confirmed + meeting credentials + email (if SMTP)
```

Lawyers **cannot** manually confirm pending appointments; only payment (or demo API) confirms them.

## Contact points for new features

| Feature area | Extend here |
|--------------|-------------|
| New API route | `backend/src/routes/` + `routes/index.ts` |
| New page | `frontend/src/pages/` + `App.tsx` route |
| New DB entity | `backend/src/models/` |
| Client API | `frontend/src/api/` + `frontend/src/types/` |
| Payment logic | `backend/src/services/payment.service.ts` |
| Webhooks | `backend/src/app.ts` (raw body route) + `payment.controller.ts` |
| Forum | `backend/src/routes/forum.routes.ts` + `services/forum.service.ts` |
| Forum UI | `frontend/src/pages/Forum*.tsx` + `components/forum/` |
