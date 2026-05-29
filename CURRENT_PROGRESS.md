# LawMittr — Current Progress

**Last updated:** Phase 6 complete (Community forum)  
**Next recommended phase:** Phase 7 — Admin dashboard APIs (moderation, lawyer verification)

---

## Phase 1 — Authentication & RBAC ✅

### Backend

| Item | Path / notes |
|------|----------------|
| User model | `backend/src/models/User.ts` — roles: user, lawyer, admin; bcrypt pre-save |
| Auth routes | `POST /api/auth/register`, `login`, `GET /me` |
| Middleware | `auth.middleware.ts`, `role.middleware.ts`, `validate.middleware.ts`, `error.middleware.ts` |
| JWT + env | `config/env.ts`, `config/database.ts` |

### Frontend

| Item | Path / notes |
|------|----------------|
| Pages | `LandingPage`, `LoginPage`, `SignupPage`, `RoleSelectionPage` |
| Dashboards (shell) | `UserDashboard`, `LawyerDashboard`, `AdminDashboard` |
| Auth state | `store/authStore.ts` (Zustand persist) |
| Auth hook | `hooks/useAuth.ts` |
| Protected routes | `components/layout/ProtectedRoute.tsx` |
| Navbar | `components/layout/Navbar.tsx` |

### Phase 1 gaps (intentional / minor)

- Admin dashboard is UI placeholder only — no admin APIs
- No email verification or password reset
- No refresh tokens (JWT expires per `JWT_EXPIRES_IN`)

---

## Phase 2 — Lawyers & Appointments ✅

### Backend models

| Model | File | Purpose |
|-------|------|---------|
| LawyerProfile | `models/LawyerProfile.ts` | specialization, experience, city, languages, consultationFee, rating, ratingCount, bio |
| AvailabilitySlot | `models/AvailabilitySlot.ts` | date, startTime, endTime, status (available/booked); unique per lawyer+date+time |
| Appointment | `models/Appointment.ts` | clientId, lawyerId, slotId (unique), status, notes, amount (set at book from lawyer fee) |

### Backend APIs (live)

See **API_CONTRACTS.md** for full request/response shapes.

- Lawyers: list/filter/paginate, get by id (+ slots), profile CRUD (lawyer), availability CRUD (lawyer)
- Appointments: book (user), get one (user), list/cancel (user), list/update status (lawyer)
- Double booking: atomic `findOneAndUpdate` on slot + unique `slotId` on appointment

### Backend services & fixes

- `services/lawyer.service.ts` — `formatLawyerProfile`, `resolveUserId` (fixes populated `userId` → `[object Object]` in list), `createDefaultLawyerProfile`, `getLawyerUser`
- `utils/pagination.ts` — shared pagination parser/meta

### Frontend — pages & routes

| Route | Component | Access |
|-------|-----------|--------|
| `/lawyers` | `LawyersPage.tsx` | Public |
| `/lawyers/:id` | `LawyerDetailPage.tsx` | Public (`:id` = lawyer **User** id) |
| `/dashboard/user` | `UserDashboard.tsx` | user |
| `/dashboard/lawyer` | `LawyerDashboard.tsx` | lawyer |

### Frontend — API modules

- `api/lawyers.api.ts`
- `api/appointments.api.ts`

### Frontend — reusable components

- `components/lawyers/` — LawyerCard, LawyerFiltersBar, ProfileEditor, AvailabilityManager
- `components/appointments/` — AppointmentCard
- `components/common/` — Pagination, LoadingState, EmptyState
- `components/ui/` — Button, Input, Card, Label, Badge, Spinner

---

## Phase 3 — Payments (Razorpay + Demo) ✅

### Backend — models & fields

| Field | On `Appointment` | Notes |
|-------|------------------|-------|
| `amount` | number | Set from `LawyerProfile.consultationFee` at book |
| `paymentStatus` | pending \| paid \| failed | |
| `paymentMode` | real \| demo | Demo txn id: `DEMO_PAYMENT_<uuid>` |
| `razorpayOrderId` | string | Set on order create |
| `razorpayPaymentId` | string | Razorpay pay id or demo id |
| `meetingId` | string | e.g. `LM-A1B2C3D4` — on confirm |
| `meetingPassword` | string | 8-char hex — on confirm |

### Backend — routes & services

| Item | Path / notes |
|------|----------------|
| Payment routes | `routes/payment.routes.ts` → mounted at `/api/payments` |
| Payment controller | `controllers/payment.controller.ts` |
| Payment service | `services/payment.service.ts` — order, verify, demo, webhook confirm, `confirmAppointmentPayment` |
| Email service | `services/email.service.ts` — nodemailer; skips gracefully if SMTP unset; logs on failure |
| Validators | `validators/payment.validator.ts` |
| Utils | `utils/razorpaySignature.ts`, `utils/meetingCredentials.ts` |
| Webhook | `POST /api/payments/webhook` in `app.ts` (raw body, before JSON parser) |
| Env | Razorpay keys required; `ENABLE_DEMO_PAYMENTS`; optional SMTP |

### Backend — appointment rule changes

- Book → `status: pending`, `paymentStatus: pending` (not confirmed until paid)
- Lawyer `PATCH .../status` — only `completed` \| `cancelled` (not `confirmed`)
- `GET /appointments/me/:id` — for payment page

### Frontend — payment UI

| Route | Component |
|-------|-----------|
| `/appointments/:appointmentId/payment` | `PaymentPage.tsx` |
| `/appointments/:appointmentId/payment/success` | `PaymentSuccessPage.tsx` |
| `/appointments/:appointmentId/payment/failure` | `PaymentFailurePage.tsx` |

| Item | Path |
|------|------|
| API client | `api/payments.api.ts` |
| Types | `types/payment.ts`, `types/razorpay.d.ts` |
| Updated types | `types/appointment.ts` (payment + meeting fields) |

### User flow (implemented)

1. Book on `LawyerDetailPage` → redirect to payment page
2. **Pay with Razorpay** → create order → checkout → verify signature on backend
3. **Continue with Demo Payment** → `POST /payments/demo` (if `ENABLE_DEMO_PAYMENTS`)
4. Success page shows meeting ID/password; email sent if SMTP configured

### Dev utilities

| Script | Command |
|--------|---------|
| Seed demo lawyer | `npm run seed:demo-lawyer` — `demo.lawyer@lawmittr.com` / `DemoLawyer1` |
| Remove demo lawyer | `npm run seed:demo-lawyer:remove` |

Scripts: `src/scripts/seed-demo-lawyer.ts`, `remove-demo-lawyer.ts`

### Phase 3 gaps / ops notes

| Topic | Notes |
|-------|-------|
| Video calling | Meeting credentials exist; WebRTC not built (Phase 4) |
| Email | Use real SMTP host (e.g. `smtp.gmail.com`), not `smtp.example.com` placeholder |
| `.env` must be saved | Server reads file on disk, not unsaved editor buffer |
| Webhook in dev | Use ngrok to expose `POST /api/payments/webhook` for Razorpay dashboard |
| Rating updates | Still not implemented |

---

## Phase 4 — Video (WebRTC + Socket.IO) ✅

### Backend — Signaling Server

- Built Socket.IO server in `server.ts` alongside Express.
- Room management in `socket/roomHandler.ts`:
  - Validates `meetingId` and `meetingPassword` against `Appointment` collection.
  - Ensures only 2 participants (client & lawyer) can join.
  - Handles reconnects with a 30-second grace period.
- WebRTC signaling events: `offer`, `answer`, `ice-candidate`.
- Chat functionality: `chat-message`, `chat-history` with in-memory persistence.

### Frontend — Meeting Room

| Route | Component |
|-------|-----------|
| `/meeting/join` | `MeetingJoinPage.tsx` |
| `/meeting/room/:meetingId` | `MeetingRoomPage.tsx` |

- `useWebRTC.ts`: Custom hook for WebRTC peer connections, robust against glare conditions and dropped ICE candidates.
- `useMeetingChat.ts`, `useMeetingTimer.ts`: Logic for sidebars and timers.
- Components: `VideoPlayer`, `MeetingControls`, `ChatPanel`, `WaitingRoom`, `ConnectionStatus`.
- Support for mute/unmute, camera toggle, and screen sharing.

---

## Phase 5 — AI Document Analyzer (RAG) ✅

### AI Service (FastAPI microservice)

| Item | Path / notes |
|------|--------------|
| Entry point | `ai-service/main.py` — FastAPI app, port 8000 |
| Config | `ai-service/config.py` — Pydantic settings from `.env` |
| PDF extraction | `services/pdf_extractor.py` — PyMuPDF + pytesseract OCR fallback |
| Text chunking | `services/chunker.py` — RecursiveCharacterTextSplitter (1000/200 overlap) |
| Embeddings | `services/embeddings.py` — dynamic (Gemini or local HuggingFace depending on provider) |
| Vector store | `services/vector_store.py` — FAISS local indexes, per-doc collections |
| RAG pipeline | `services/rag_pipeline.py` — retrieval + Gemini generation with citations |
| Legal analyzer | `services/legal_analyzer.py` — 4 parallel chains; supports Groq and Gemini models |
| Prompts | `prompts/legal_prompts.py` — all analysis + chat prompt templates |
| Analyze endpoint | `POST /analyze` — upload PDF → full pipeline → structured analysis |
| Chat endpoint | `POST /chat` — RAG Q&A with citations |
| Health | `GET /health` |

### Backend (Express proxy + MongoDB)

| Item | Path / notes |
|------|--------------|
| Document model | `models/Document.ts` — metadata, AI reference, analysis summary |
| Routes | `routes/document.routes.ts` → mounted at `/api/documents` |
| Controller | `controllers/document.controller.ts` — multer upload, AI proxy |
| Service | `services/document.service.ts` — AI HTTP calls, CRUD, formatting |
| Validator | `validators/document.validator.ts` — Zod chat schema |
| Env | `AI_SERVICE_URL` in `config/env.ts` (default `http://localhost:8000`) |

### Frontend

| Route | Component | Access |
|-------|-----------|--------|
| `/documents` | `DocumentsPage.tsx` | user, lawyer |
| `/documents/:documentId` | `DocumentAnalysisPage.tsx` | user, lawyer |

| Item | Path |
|------|------|
| API client | `api/documents.api.ts` |
| Types | `types/document.ts` |
| Upload zone | `components/documents/DocumentUploadZone.tsx` |
| Document card | `components/documents/DocumentCard.tsx` |
| Summary panel | `components/documents/AnalysisSummary.tsx` |
| Risky clause card | `components/documents/RiskyClauseCard.tsx` |
| Obligation list | `components/documents/ObligationList.tsx` |
| Chat panel | `components/documents/DocumentChatPanel.tsx` |
| Citation highlight | `components/documents/CitationHighlight.tsx` |
| Navbar | Updated — "AI Analyzer" link for authenticated users |
| User Dashboard | Updated — AI analyzer CTA card |

### AI Features implemented

- Legal document summary
- Risky clause detection (with severity: high/medium/low)
- Obligation extraction (grouped by party)
- Simple language explanation
- Document chat (RAG Q&A with citations)
- PDF text extraction + OCR fallback for scanned documents

---

## Phase 6 — Community Forum ✅

### Backend models

| Model | File | Purpose |
|-------|------|---------|
| ForumPost | `models/ForumPost.ts` | title, content, authorId, isAnonymous, category, tags, upvotesCount, commentsCount |
| ForumComment | `models/ForumComment.ts` | postId, authorId, content |
| ForumVote | `models/ForumVote.ts` | postId, userId, voteType (`upvote`); unique index prevents duplicate votes |

**Categories:** `general`, `family-law`, `criminal-law`, `property-law`, `corporate-law`, `labor-law`, `consumer-rights`, `constitutional-law`, `other`

### Backend APIs (live)

See **API_CONTRACTS.md** — Forum section.

| Area | Endpoints |
|------|-----------|
| Posts | `GET/POST /forum/posts`, `GET/PATCH/DELETE /forum/posts/:id` |
| Comments | `GET/POST /forum/posts/:postId/comments`, `PATCH/DELETE /forum/comments/:id` |
| Votes | `POST/DELETE /forum/posts/:id/vote` |

- Public read for posts + comments; `optionalAuthenticate` adds `hasVoted` / `isOwner` when JWT present
- Writes require JWT (`user`, `lawyer`, `admin`)
- Edit/delete own content; `admin` can modify any post/comment
- Anonymous posts hide `author` / `authorId` from others (author still sees `isOwner`)
- List filters: `search` (text index), `category`, `tag`, `unanswered=true`, `sortBy=newest|popular`
- Cascade delete: removing a post deletes its comments and votes

### Backend files

| Item | Path |
|------|------|
| Routes | `routes/forum.routes.ts` → `/api/forum` |
| Controller | `controllers/forum.controller.ts` |
| Service | `services/forum.service.ts` — formatters, filters, cascade delete |
| Validator | `validators/forum.validator.ts` |
| Auth helper | `optionalAuthenticate` in `middleware/auth.middleware.ts` |

### Frontend — pages & routes

| Route | Component | Access |
|-------|-----------|--------|
| `/forum` | `ForumPage.tsx` | Public |
| `/forum/post/:id` | `ForumPostPage.tsx` | Public |
| `/forum/create` | `ForumCreatePage.tsx` | user, lawyer, admin |

### Frontend — API & components

| Item | Path |
|------|------|
| API client | `api/forum.api.ts` |
| Types | `types/forum.ts` |
| Components | `components/forum/` — PostCard, PostEditor, CommentSection, CommentCard, CategoryFilter, SearchBar, TagSelector, EmptyState |

### Dashboard updates

| Dashboard | Additions |
|-----------|-----------|
| User | Recent forum discussions; “New post” CTA → `/forum/create` |
| Lawyer | Unanswered discussions (`unanswered=true`); “Participate” CTA → `/forum` |

### Navbar

- **Forum** link added (public, all users)

### Phase 6 gaps (intentional / future)

- No admin moderation UI (Phase 7)
- No post/comment reporting or flags
- No rich-text editor or image attachments
- No email notifications on replies

---

## Phase 7+ — Not started 🔲

### Phase 7 — Admin platform

- [ ] Admin APIs: users, lawyers, appointments, forum content
- [ ] Lawyer verification workflow
- [ ] Wire `AdminDashboard.tsx` to real data
- [ ] Forum moderation (optional)

---

## Build & run verification

```bash
cd backend && npm run build   # tsc → dist/
cd frontend && npm run build  # tsc + vite build

# AI service
cd ai-service && pip install -r requirements.txt
cd ai-service && uvicorn main:app --reload --port 8000
```

## Environment files

| File | Purpose |
|------|---------|
| `backend/.env.example` | PORT, MongoDB, JWT, CLIENT_URL, Razorpay, ENABLE_DEMO_PAYMENTS, optional SMTP, AI_SERVICE_URL |
| `frontend/.env.example` | VITE_API_URL |
| `ai-service/.env.example` | GEMINI_API_KEY, GROQ_API_KEY, MODEL_PROVIDER, GROQ_MODEL, CHROMA_PERSIST_DIR, UPLOAD_DIR |

**Required for Phase 3 backend startup:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

## Git / deployment

- Not yet configured for Vercel/Render
- `.env` is gitignored; never commit secrets
