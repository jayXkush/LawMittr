# LawMittr — Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  React 19 + Vite + React Router + TanStack Query + Zustand       │
│  Tailwind v4 · Framer Motion · Axios · Razorpay Checkout         │
│  WebRTC + Socket.IO Client                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP REST (JSON) / Multipart Forms
                             │ Authorization: Bearer JWT
                             │ WebSocket (Socket.IO)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express API (Node.js + TypeScript)                  │
│  Port 5000 · CORS → CLIENT_URL · /api prefix                     │
│  Middleware: cors → webhook(raw) → json → routes → 404 → error   │
│  Socket.IO Server (Room + WebRTC Signaling)                      │
│  Multer (Document Uploads)                                       │
└──────┬──────────────────────┬───────────────┬──────────────┬────┘
       │                      │               │              │
       ▼                      ▼               ▼              ▼
┌──────────────┐    ┌──────────────────┐    ┌───────┐    ┌──────────────┐
│   MongoDB    │    │     Razorpay     │    │ SMTP  │    │  FastAPI AI  │
│ Atlas/local  │    │ orders + webhook │    │       │    │  (Port 8000) │
└──────────────┘    └──────────────────┘    └───────┘    └───────┬──────┘
                                                                 │
                                                                 ▼
                                                          ┌──────────────┐
                                                          │ FAISS        │
                                                          │ (Local Index)│
                                                          └──────────────┘
```

---

## Backend architecture

### Request lifecycle

```
HTTP Request
    → cors
    → [POST /api/payments/webhook only] express.raw({ type: 'application/json' })
    → express.json() (10kb limit)
    → /api/{module} routes
    → authenticate (optional)
    → authorize(roles) (optional)
    → validate(zodSchema) (optional)
    → controller (asyncHandler)
    → services / Mongoose models
    → JSON response
    → errorHandler (AppError or 500)
```

### Directory structure

```
backend/src/
├── server.ts              # Bootstrap: connect DB, listen
├── app.ts                 # Express app; webhook route before json()
├── config/
│   ├── env.ts             # Zod-validated env; path: backend/.env
│   └── database.ts
├── models/
│   ├── User.ts
│   ├── LawyerProfile.ts
│   ├── AvailabilitySlot.ts
│   ├── Appointment.ts     # + payment & meeting fields
│   ├── Document.ts        # Phase 5 AI document metadata
│   ├── ForumPost.ts       # Phase 6 community discussions
│   ├── ForumComment.ts
│   └── ForumVote.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── lawyer.controller.ts
│   ├── appointment.controller.ts
│   ├── payment.controller.ts
│   ├── document.controller.ts
│   └── forum.controller.ts
├── services/
│   ├── lawyer.service.ts  # formatLawyerProfile, resolveUserId, getLawyerUser
│   ├── payment.service.ts # Razorpay, confirm, demo, webhook
│   ├── email.service.ts   # confirmation emails
│   ├── document.service.ts# AI microservice proxy + MongoDB CRUD
│   └── forum.service.ts   # formatters, filters, cascade delete, vote helpers
├── routes/
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── lawyer.routes.ts
│   ├── appointment.routes.ts
│   ├── payment.routes.ts
│   ├── document.routes.ts
│   └── forum.routes.ts
├── middleware/
│   ├── auth.middleware.ts # authenticate + optionalAuthenticate
│   ├── role.middleware.ts
│   ├── validate.middleware.ts
│   └── error.middleware.ts
├── validators/
│   ├── auth.validator.ts
│   ├── lawyer.validator.ts
│   ├── appointment.validator.ts
│   ├── payment.validator.ts
│   ├── document.validator.ts
│   └── forum.validator.ts
├── utils/
│   ├── AppError.ts
│   ├── asyncHandler.ts
│   ├── pagination.ts
│   ├── razorpaySignature.ts
│   └── meetingCredentials.ts
├── socket/
│   ├── roomHandler.ts     # WebRTC signaling and chat
│   └── socketAuth.ts      # Socket.IO JWT authentication
├── scripts/               # Dev-only seeds (not part of runtime API)
│   ├── seed-demo-lawyer.ts
│   └── remove-demo-lawyer.ts
└── types/
    └── express.d.ts
```

### AI Service Directory Structure (Phase 5)

```
ai-service/
├── main.py                # FastAPI app entry point
├── config.py              # Pydantic Settings & env loading
├── requirements.txt       # Dependencies
├── .env                   # GEMINI_API_KEY, paths
├── models/
│   └── schemas.py         # Pydantic models for API and analysis structure
├── routers/
│   ├── analyze.py         # POST /analyze route
│   └── chat.py            # POST /chat route
├── services/
│   ├── pdf_extractor.py   # PyMuPDF + OCR fallback
│   ├── chunker.py         # LangChain RecursiveCharacterTextSplitter
│   ├── embeddings.py      # Gemini embedding-001 setup
│   ├── vector_store.py    # FAISS local indexes + retrieve
│   ├── legal_analyzer.py  # 4 parallel chains (summary, risk, obligations)
│   └── rag_pipeline.py    # Combine retrieval + QA generation
└── prompts/
    └── legal_prompts.py   # LangChain prompt templates
```

### Data model relationships

```
User (1) ────────────── (1) LawyerProfile
  │                              │
  │ role: lawyer                 │ userId
  │                              │
  ├── (1:N) AvailabilitySlot ◄───┘ lawyerId
  │         status: available | booked
  │
  ├── (1:N) Appointment as clientId (user)
  └── (1:N) Appointment as lawyerId (lawyer)

Appointment (N:1) AvailabilitySlot via slotId (unique)

Appointment (payment fields):
  amount, paymentStatus, paymentMode, razorpayOrderId, razorpayPaymentId,
  meetingId, meetingPassword

User (1) ── (N) ForumPost as authorId
  │
  ├── (1:N) ForumComment as authorId
  └── (1:N) ForumVote as userId (unique per postId + userId)

ForumPost (1) ── (N) ForumComment via postId
ForumPost (1) ── (N) ForumVote via postId
```

### Forum flow (Phase 6)

```
GET /forum/posts (public, optional JWT)
    → search / category / tag / unanswered filters + pagination

POST /forum/posts (authenticated)
    → create post; optional isAnonymous

POST /forum/posts/:id/vote
    → ForumVote.create (unique index) + upvotesCount++

DELETE /forum/posts/:id/vote
    → remove vote + upvotesCount--

POST /forum/posts/:postId/comments
    → comment create + commentsCount++

DELETE /forum/posts/:id (author or admin)
    → cascade: comments + votes + post
```

### Booking + payment flow

```
Client POST /appointments { slotId }
    │
    ▼
Atomic slot book (available → booked) + Appointment.create
    status: pending, paymentStatus: pending, amount: lawyer.consultationFee
    │
    ▼
Frontend → GET /appointments/me/:id → PaymentPage
    │
    ├─ POST /payments/orders → Razorpay Checkout
    │       → POST /payments/verify (HMAC signature)
    │
    └─ POST /payments/demo (if ENABLE_DEMO_PAYMENTS)
    │
    ▼
confirmAppointmentPayment() [shared]
    paymentStatus: paid, status: confirmed
    meetingId + meetingPassword generated
    optional: sendAppointmentConfirmationEmails()
    │
    └─ Razorpay webhook payment.captured → same confirm (idempotent)
```

### Lawyer list `userId` handling

`GET /lawyers` uses `.populate('userId')`. `formatLawyerProfile` uses `resolveUserId()` so API `userId` is always a string User id (never `[object Object]`).

### Auth model

- **Register/Login** returns JWT signed with `{ id, email, role }`
- **JWT** stored client-side; no httpOnly cookie yet
- **Password:** bcrypt rounds 12 via Mongoose pre-save on User

### Route mounting

| Mount | Router file | Notes |
|-------|-------------|-------|
| `/api/auth` | `auth.routes.ts` | |
| `/api/lawyers` | `lawyer.routes.ts` | Static paths before `/:id` |
| `/api/appointments` | `appointment.routes.ts` | All routes `authenticate` |
| `/api/payments` | `payment.routes.ts` | `demo-enabled` public; rest user + JWT |
| `/api/payments/webhook` | `app.ts` directly | Raw body; not in JSON router |
| `/api/documents` | `document.routes.ts` | All routes `authenticate` |
| `/api/forum` | `forum.routes.ts` | Public read + `optionalAuthenticate`; writes authenticated |
| `/api/meetings` | `meeting.routes.ts` | Meeting validation |

---

## Frontend architecture

### Directory structure

```
frontend/src/
├── main.tsx
├── App.tsx                # Routes incl. payment flow (user-protected)
├── api/
│   ├── axios.ts
│   ├── auth.api.ts
│   ├── lawyers.api.ts
│   ├── appointments.api.ts
│   ├── payments.api.ts
│   ├── documents.api.ts
│   └── forum.api.ts
├── store/
│   └── authStore.ts
├── hooks/
│   └── useAuth.ts
├── types/
│   ├── auth.ts
│   ├── lawyer.ts
│   ├── appointment.ts
│   ├── payment.ts
│   ├── razorpay.d.ts
│   ├── document.ts
│   ├── forum.ts
│   └── api.ts
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── RoleSelectionPage.tsx
│   ├── LawyersPage.tsx
│   ├── LawyerDetailPage.tsx   # book → redirect to payment
│   ├── PaymentPage.tsx
│   ├── PaymentSuccessPage.tsx
│   ├── PaymentFailurePage.tsx
│   ├── MeetingJoinPage.tsx    # Room entry validation
│   ├── MeetingRoomPage.tsx    # WebRTC video + chat
│   ├── DocumentsPage.tsx
│   ├── DocumentAnalysisPage.tsx
│   ├── ForumPage.tsx
│   ├── ForumPostPage.tsx
│   ├── ForumCreatePage.tsx
│   └── dashboards/
│       ├── UserDashboard.tsx
│       ├── LawyerDashboard.tsx
│       └── AdminDashboard.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── lawyers/
│   ├── appointments/      # AppointmentCard: pay CTA, meeting info
│   ├── meeting/           # VideoPlayer, ChatPanel, MeetingControls
│   ├── documents/         # DocumentUploadZone, DocumentCard, chat panels
│   ├── forum/             # PostCard, PostEditor, CommentSection, filters
│   └── common/
└── lib/
    └── utils.ts
```

### State management strategy

| Concern | Tool |
|---------|------|
| Auth session | Zustand + localStorage persist |
| Server data | TanStack React Query |
| Form validation | Zod (auth forms) |
| Payment UI | Mutations + Razorpay modal callback → verify API |

### Routing & access control

```
Public:  /, /lawyers, /lawyers/:id, /forum, /forum/post/:id, /login, /signup, /signup/role

Protected (JWT) — user:
  /dashboard/user
  /appointments/:appointmentId/payment
  /appointments/:appointmentId/payment/success
  /appointments/:appointmentId/payment/failure

Protected — user | lawyer:
  /documents, /documents/:documentId
  /meeting/join, /meeting/room/:meetingId

Protected — user | lawyer | admin:
  /forum/create

Protected — lawyer:  /dashboard/lawyer
Protected — admin:   /dashboard/admin
```

### Vite dev proxy

`vite.config.ts` proxies `/api` → `http://localhost:5000`.

---

## Cross-cutting concerns

### Error handling

- Backend: operational errors → `{ success: false, message }` + status
- Payment/email failures: payment confirm succeeds even if email fails (logged)
- Frontend: Axios errors in mutation `onError`; payment redirects to failure page

### Validation

- Backend: Zod in `validators/` → `validate()` on body
- Razorpay: server-side signature verify (payment + webhook)

### Security notes (current)

| Topic | Implementation |
|-------|----------------|
| Password hashing | bcrypt (12 rounds) |
| API auth | JWT Bearer |
| CORS | `CLIENT_URL` |
| Role checks | `authorize()` |
| Payment verify | HMAC SHA256 (`orderId\|paymentId`) |
| Webhook verify | HMAC on raw body + `X-Razorpay-Signature` |
| Demo payments | Gated by `ENABLE_DEMO_PAYMENTS` env |
| Forum votes | Unique `(postId, userId)` index; 409 on duplicate |
| Anonymous posts | Author hidden in API responses except to owner |
| Rate limiting | Not implemented |

---

## Deployment target (planned)

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Render or Railway |
| Database | MongoDB Atlas |
| AI service | Separate Python host (TBD) |

---

## Extension guidelines for new phases

1. **New collection** → `models/` + indexes
2. **New REST resource** → routes + controller + validators + `routes/index.ts`
3. **New frontend feature** → `api/*.api.ts` + `types/` + page + `App.tsx`
4. **Microservice (AI)** → HTTP from Express; env `AI_SERVICE_URL`
5. **Webhooks** → raw body route in `app.ts` before `express.json()`
6. **Socket.IO / WebRTC** → attach in `server.ts`; use `meetingId` on Appointment; `socket/` folder
7. **Seeds** → `src/scripts/` + npm script; never run in production without guard

---

## Related docs

- **PROJECT_CONTEXT.md** — product vision, conventions, handoff prompt
- **CURRENT_PROGRESS.md** — phase checklist and gaps
- **API_CONTRACTS.md** — endpoint request/response reference
