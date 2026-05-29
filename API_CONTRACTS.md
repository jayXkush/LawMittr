# LawMittr — API Contracts

**Base URL:** `http://localhost:5000/api` (production TBD)  
**Auth header:** `Authorization: Bearer <jwt>` where noted  
**Phases documented:** 1 (auth), 2 (lawyers + appointments), 3 (payments), 5 (documents), 6 (forum)

All success responses use JSON. Errors:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

---

## Common types

### Pagination meta (list endpoints)

```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### User (auth responses)

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user | lawyer | admin",
  "createdAt": "ISO8601"
}
```

### Lawyer (public profile)

```json
{
  "id": "LawyerProfile document id",
  "userId": "User id — use for /lawyers/:id routes",
  "name": "string",
  "email": "string",
  "specialization": ["Criminal Law"],
  "experience": 5,
  "city": "Mumbai",
  "languages": ["English", "Hindi"],
  "consultationFee": 1500,
  "rating": 4.5,
  "ratingCount": 12,
  "bio": "optional string"
}
```

### Availability slot

```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "available | booked"
}
```

### Appointment

```json
{
  "id": "string",
  "clientId": "string",
  "lawyerId": "string",
  "slotId": "string",
  "date": "YYYY-MM-DD",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "pending | confirmed | completed | cancelled",
  "amount": 1500,
  "paymentStatus": "pending | paid | failed",
  "paymentMode": "real | demo | null",
  "razorpayOrderId": "string | null",
  "razorpayPaymentId": "string | null",
  "meetingId": "string | null — when confirmed",
  "meetingPassword": "string | null — when confirmed",
  "notes": "optional",
  "createdAt": "ISO8601",
  "client": { "id": "string", "name": "string", "email": "string" },
  "lawyer": {
    "id": "string",
    "name": "string",
    "email": "string",
    "specialization": ["string"],
    "city": "string",
    "consultationFee": 1500
  }
}
```

### Payment status workflow

| Step | appointment.status | paymentStatus | paymentMode |
|------|-------------------|---------------|-------------|
| After book | `pending` | `pending` | `null` |
| After Razorpay verify or demo | `confirmed` | `paid` | `real` or `demo` |
| Demo transaction id | — | — | `razorpayPaymentId`: `DEMO_PAYMENT_<uuid>` |

Meeting fields (`meetingId`, `meetingPassword`) are populated only when `status` is `confirmed`.

### Document

```json
{
  "id": "string",
  "userId": "string",
  "filename": "string",
  "originalName": "string",
  "fileSize": 1024,
  "pageCount": 5,
  "aiDocumentId": "string",
  "status": "processing | analyzed | failed",
  "analysis": {
    "summary": "string",
    "riskyClausesCount": 2,
    "obligationsCount": 5
  },
  "fullAnalysis": {
    "summary": "string",
    "risky_clauses": [
      {
        "clause": "string",
        "risk_level": "high | medium | low",
        "explanation": "string",
        "page": 2,
        "source_chunk_ids": ["string"]
      }
    ],
    "obligations": [
      {
        "party": "string",
        "obligation": "string",
        "source_text": "string",
        "page": 1
      }
    ],
    "simple_explanation": "string"
  },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

## Health

### `GET /health`

**Auth:** none

```json
{ "success": true, "message": "LawMittr API is running" }
```

---

## Auth (`/auth`)

### `POST /auth/register`

**Auth:** none

**Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1",
  "role": "user | lawyer"
}
```

**Password rules:** min 8 chars, 1 upper, 1 lower, 1 number

**Response `201`:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { /* User */ },
    "token": "jwt"
  }
}
```

**Notes:** `role: lawyer` auto-creates empty `LawyerProfile`.

---

### `POST /auth/login`

**Auth:** none

**Body:**

```json
{
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Response `200`:** same shape as register success.

---

### `GET /auth/me`

**Auth:** JWT (any role)

**Response `200`:**

```json
{
  "success": true,
  "data": { "user": { /* User */ } }
}
```

---

## Lawyers (`/lawyers`)

### `GET /lawyers`

**Auth:** none

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | default 1 |
| limit | number | default 10, max 50 |
| search | string | name or specialization substring |
| specialization | string | filter |
| city | string | filter |
| language | string | filter (matches languages array) |
| minRating | number | e.g. 4 |
| maxFee | number | max consultation fee |
| sortBy | rating \| fee \| experience | default rating |
| sortOrder | asc \| desc | default desc |

**Response `200`:**

```json
{
  "success": true,
  "data": { "lawyers": [ /* Lawyer[] */ ] },
  "meta": { /* PaginationMeta */ }
}
```

**Important:** Each lawyer's `userId` is the **User** document id. Use it in `/lawyers/:id` links (not `id`, which is the LawyerProfile document id).

---

### `GET /lawyers/:id`

**Auth:** none  
**`:id`** = lawyer **User** id (`userId` from list), not LawyerProfile id

**Query:** `fromDate` (optional, `YYYY-MM-DD`) — slots from this date onward

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "lawyer": { /* Lawyer */ },
    "availableSlots": [ /* AvailabilitySlot[] — status available only */ ]
  }
}
```

---

### `GET /lawyers/profile/me`

**Auth:** JWT + role `lawyer`

**Response `200`:**

```json
{
  "success": true,
  "data": { "lawyer": { /* Lawyer */ } }
}
```

---

### `PUT /lawyers/profile/me`

**Auth:** JWT + role `lawyer`

**Body (all optional):**

```json
{
  "specialization": ["Family Law"],
  "experience": 8,
  "city": "Delhi",
  "languages": ["English"],
  "consultationFee": 2000,
  "bio": "About me..."
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "lawyer": { /* Lawyer */ } }
}
```

---

### `GET /lawyers/availability/me`

**Auth:** JWT + role `lawyer`

**Response `200`:**

```json
{
  "success": true,
  "data": { "slots": [ /* AvailabilitySlot[] — all statuses */ ] }
}
```

---

### `POST /lawyers/availability/me`

**Auth:** JWT + role `lawyer`

**Body:**

```json
{
  "date": "2026-06-01",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Availability slot created",
  "data": { "slot": { /* AvailabilitySlot */ } }
}
```

**Errors:** `409` duplicate slot

---

### `DELETE /lawyers/availability/me/:slotId`

**Auth:** JWT + role `lawyer`

**Response `200`:** `{ "success": true, "message": "Slot deleted successfully" }`  
**Errors:** `400` if slot is `booked`, `404` if not found

---

## Appointments (`/appointments`)

All routes require JWT. Router applies `authenticate` globally.

### `POST /appointments`

**Auth:** JWT + role `user`

**Body:**

```json
{
  "slotId": "AvailabilitySlot id",
  "notes": "optional, max 500 chars"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": { "appointment": { /* Appointment */ } }
}
```

**Errors:**

- `400` — lawyer consultation fee not configured (≤ 0)
- `409` — slot unavailable or already booked (double-booking prevented)

**Side effects:** slot `status` → `booked`; appointment `status` → `pending`, `paymentStatus` → `pending`, `amount` from lawyer profile

**Client flow:** redirect to `/appointments/:id/payment` after success

---

### `GET /appointments/me/:id`

**Auth:** JWT + role `user` (own appointment)

**Response `200`:** `{ "success": true, "data": { "appointment": { /* Appointment */ } } }`

---

### `GET /appointments/me`

**Auth:** JWT + role `user`

**Query:**

| Param | Values |
|-------|--------|
| filter | `upcoming` \| `history` |
| page, limit | pagination |

**`upcoming`:** date ≥ today AND status in `pending`, `confirmed`  
**`history`:** date < today OR status in `completed`, `cancelled`

**Response `200`:**

```json
{
  "success": true,
  "data": { "appointments": [ /* Appointment[] */ ] },
  "meta": { /* PaginationMeta */ }
}
```

---

### `PATCH /appointments/me/:id/cancel`

**Auth:** JWT + role `user`

**Response `200`:**

```json
{
  "success": true,
  "message": "Appointment cancelled",
  "data": { "appointment": { /* Appointment, status cancelled */ } }
}
```

**Side effects:** slot released → `available`

**Errors:** `404` if not found or not cancellable

---

### `GET /appointments/lawyer`

**Auth:** JWT + role `lawyer`

**Query:** `page`, `limit`, optional `status`

**Response `200`:** same list shape as `/appointments/me`

---

### `PATCH /appointments/:id/status`

**Auth:** JWT + role `lawyer` (must own appointment)

**Body:**

```json
{
  "status": "completed | cancelled"
}
```

**Notes:** Lawyers cannot manually set `confirmed` — that happens after payment.

**Response `200`:**

```json
{
  "success": true,
  "message": "Appointment status updated",
  "data": { "appointment": { /* Appointment */ } }
}
```

**Side effects:** if `cancelled`, slot → `available`

---

## Payments (`/payments`)

### `GET /payments/demo-enabled`

**Auth:** none

```json
{ "success": true, "data": { "enabled": true } }
```

---

### `POST /payments/orders`

**Auth:** JWT + role `user`

**Body:** `{ "appointmentId": "string" }`

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "order_xxx",
      "amount": 1500,
      "amountPaise": 150000,
      "currency": "INR",
      "keyId": "rzp_test_xxx",
      "appointmentId": "string"
    }
  }
}
```

---

### `POST /payments/verify`

**Auth:** JWT + role `user`

**Body:**

```json
{
  "appointmentId": "string",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "hex"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Payment verified and appointment confirmed",
  "data": { "appointment": { /* Appointment — confirmed, meetingId set */ } }
}
```

**Errors:** `400` invalid signature; `404` appointment not payable

---

### `POST /payments/demo`

**Auth:** JWT + role `user`  
**Requires:** `ENABLE_DEMO_PAYMENTS=true`

**Body:** `{ "appointmentId": "string" }`

**Response `200`:** same shape as verify; `paymentMode`: `"demo"`, `razorpayPaymentId`: `DEMO_PAYMENT_<uuid>`

**Errors:** `403` if `ENABLE_DEMO_PAYMENTS` is not true

---

### `POST /payments/webhook`

**Auth:** Razorpay signature header `X-Razorpay-Signature`  
**Body:** raw JSON (route in `app.ts` before `express.json()`)

**Env:** `RAZORPAY_WEBHOOK_SECRET` required for webhook processing

**Events handled:** `payment.captured` → confirms appointment if still `pending` + unpaid (idempotent)

**Response `200`:** `{ "success": true }`

---

## Forum (`/forum`)

### Forum post

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "authorId": "string | null",
  "author": { "id": "string", "name": "string", "role": "user | lawyer | admin" } | null,
  "isAnonymous": false,
  "category": "general | family-law | criminal-law | property-law | corporate-law | labor-law | consumer-rights | constitutional-law | other",
  "tags": ["tenant-rights"],
  "upvotesCount": 0,
  "commentsCount": 0,
  "hasVoted": false,
  "isOwner": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Anonymous posts:** `author` and `authorId` are hidden from other users; the author still sees their identity (`isOwner: true`).

### Forum comment

```json
{
  "id": "string",
  "postId": "string",
  "authorId": "string",
  "author": { "id": "string", "name": "string", "role": "string" },
  "content": "string",
  "isOwner": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

### `GET /forum/posts`

**Auth:** optional JWT (for `hasVoted` / `isOwner`)

**Query:**

| Param | Description |
|-------|-------------|
| page, limit | pagination (default 1, 10; max limit 50) |
| search | full-text search on title + content |
| category | filter by category slug |
| tag | filter posts containing tag (lowercase) |
| unanswered | `true` — posts with `commentsCount === 0` (lawyer dashboard) |
| sortBy | `newest` (default) \| `popular` |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "posts": [ /* Forum post[] */ ],
    "categories": ["general", "family-law", "..."]
  },
  "meta": { /* PaginationMeta */ }
}
```

---

### `GET /forum/posts/:id`

**Auth:** optional JWT

**Response `200`:** `{ "success": true, "data": { "post": { /* Forum post */ } } }`

---

### `POST /forum/posts`

**Auth:** JWT + role `user` \| `lawyer` \| `admin`

**Body:**

```json
{
  "title": "string (3–200 chars)",
  "content": "string (10–10000 chars)",
  "isAnonymous": false,
  "category": "general",
  "tags": ["tenant-rights"]
}
```

**Response `201`:** `{ "success": true, "message": "Post created successfully", "data": { "post": { /* Forum post */ } } }`

---

### `PATCH /forum/posts/:id`

**Auth:** JWT — author or `admin`

**Body:** any subset of create fields

**Response `200`:** updated post

---

### `DELETE /forum/posts/:id`

**Auth:** JWT — author or `admin`

**Side effects:** deletes all comments and votes for the post

**Response `200`:** `{ "success": true, "message": "Post deleted successfully" }`

---

### `GET /forum/posts/:postId/comments`

**Auth:** optional JWT

**Query:** `page`, `limit`

**Response `200`:**

```json
{
  "success": true,
  "data": { "comments": [ /* Forum comment[] */ ] },
  "meta": { /* PaginationMeta */ }
}
```

---

### `POST /forum/posts/:postId/comments`

**Auth:** JWT + role `user` \| `lawyer` \| `admin`

**Body:** `{ "content": "string (1–5000 chars)" }`

**Response `201`:** comment object; increments post `commentsCount`

---

### `PATCH /forum/comments/:id`

**Auth:** JWT — comment author or `admin`

**Body:** `{ "content": "string" }`

---

### `DELETE /forum/comments/:id`

**Auth:** JWT — comment author or `admin`

**Side effects:** decrements post `commentsCount`

---

### `POST /forum/posts/:id/vote`

**Auth:** JWT + role `user` \| `lawyer` \| `admin`

**Response `200`:** updated post with `hasVoted: true`

**Errors:** `409` if already voted (unique index on `postId` + `userId`)

---

### `DELETE /forum/posts/:id/vote`

**Auth:** JWT + role `user` \| `lawyer` \| `admin`

**Response `200`:** updated post with `hasVoted: false`

**Errors:** `404` if user has not voted

---

## HTTP status codes used

| Code | When |
|------|------|
| 400 | Validation / bad request |
| 401 | Missing or invalid JWT |
| 403 | Wrong role or demo payments disabled |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, slot, booking, forum upvote) |
| 500 | Unhandled server error |
| 503 | AI analysis service is temporarily unavailable |

---

## Documents (`/documents`)

All routes require JWT (`user` or `lawyer` role).

### `POST /documents/upload`

**Auth:** JWT (`user`, `lawyer`)
**Format:** `multipart/form-data`
**Body:** `file` (PDF only, max 10MB)

**Response `201`:**

```json
{
  "success": true,
  "message": "Document analyzed successfully",
  "data": { "document": { /* Document with fullAnalysis */ } }
}
```

### `GET /documents/me`

**Auth:** JWT (`user`, `lawyer`)
**Query:** `page`, `limit`

**Response `200`:**

```json
{
  "success": true,
  "data": { "documents": [ /* Document[] (without fullAnalysis) */ ] },
  "meta": { /* PaginationMeta */ }
}
```

### `GET /documents/:id`

**Auth:** JWT (`user`, `lawyer`)

**Response `200`:**

```json
{
  "success": true,
  "data": { "document": { /* Document with fullAnalysis */ } }
}
```

### `POST /documents/:id/chat`

**Auth:** JWT (`user`, `lawyer`)

**Body:**

```json
{
  "question": "string (max 2000 chars)"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "answer": "string",
    "citations": [
      {
        "text": "string",
        "page": 1,
        "chunk_id": "string",
        "relevance_score": 0.85
      }
    ]
  }
}
```

### `DELETE /documents/:id`

**Auth:** JWT (`user`, `lawyer`)

**Response `200`:** `{ "success": true, "message": "Document deleted successfully" }`

---

## AI Microservice (FastAPI - Internal)

These endpoints run on port 8000 and are called internally by the Express backend.

### `POST /analyze`

**Auth:** Internal network only (or CORS from backend)
**Format:** `multipart/form-data`
**Body:** `file` (PDF document)

**Response `200`:**

```json
{
  "document_id": "uuid",
  "filename": "string",
  "page_count": 5,
  "text_length": 15000,
  "analysis": {
    "summary": "string",
    "risky_clauses": [
      {
        "clause": "string",
        "risk_level": "medium",
        "explanation": "string",
        "page": 1,
        "source_chunk_ids": ["uuid"]
      }
    ],
    "obligations": [
      {
        "party": "string",
        "obligation": "string",
        "source_text": "string",
        "page": 1
      }
    ],
    "simple_explanation": "string"
  }
}
```

**Errors:**
- `400` File too large or not a PDF
- `422` Could not extract text from PDF
- `500` Analysis failed (usually API provider error or DNS block for embeddings)

### `POST /chat`

**Auth:** Internal network only

**Body:**

```json
{
  "document_id": "uuid",
  "question": "string"
}
```

**Response `200`:**

```json
{
  "answer": "string",
  "citations": [
    {
      "text": "string",
      "page": 1,
      "chunk_id": "uuid",
      "relevance_score": 0.85
    }
  ]
}
```

---

## Frontend API client mapping

| Backend | Frontend module |
|---------|-----------------|
| `/auth/*` | `frontend/src/api/auth.api.ts` |
| `/lawyers/*` | `frontend/src/api/lawyers.api.ts` |
| `/appointments/*` | `frontend/src/api/appointments.api.ts` |
| `/payments/*` | `frontend/src/api/payments.api.ts` |
| `/documents/*` | `frontend/src/api/documents.api.ts` |
| `/forum/*` | `frontend/src/api/forum.api.ts` |
| Axios instance | `frontend/src/api/axios.ts` |

Types mirrored in `frontend/src/types/`.

### Frontend routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/appointments/:appointmentId/payment` | Pay with Razorpay / demo | user |
| `/appointments/:appointmentId/payment/success` | Confirmation + meeting credentials | user |
| `/appointments/:appointmentId/payment/failure` | Retry payment | user |
| `/meeting/join` | Enter meeting ID + password | user, lawyer |
| `/meeting/room/:meetingId` | WebRTC video consultation | user, lawyer |
| `/documents` | List uploaded documents | user, lawyer |
| `/documents/:documentId` | View AI analysis and chat | user, lawyer |
| `/forum` | Browse discussions (search, filters, pagination) | public |
| `/forum/post/:id` | Post detail, upvote, comments | public |
| `/forum/create` | Create new discussion | user, lawyer, admin |

---

## Backend environment (Phase 3)

| Variable | Required | Purpose |
|----------|----------|---------|
| `RAZORPAY_KEY_ID` | yes | Order creation + checkout key |
| `RAZORPAY_KEY_SECRET` | yes | Signature verify |
| `RAZORPAY_WEBHOOK_SECRET` | webhook only | Webhook HMAC |
| `ENABLE_DEMO_PAYMENTS` | no | `true` enables `POST /payments/demo` |
| `SMTP_*`, `EMAIL_FROM` | no | Confirmation email; omitted = log only |
| `AI_SERVICE_URL` | no | URL to FastAPI AI microservice (defaults to http://localhost:8000) |

**Note:** Use a real SMTP host (e.g. `smtp.gmail.com`). Placeholder `smtp.example.com` will fail DNS.

---

## Socket.IO Events (Phase 4)

**Connection:** `ws://localhost:5000`  
**Auth:** `{ auth: { token: "<jwt>" } }`

### `join-room`

Client requests to join a meeting room.
- **Emit:** `{ meetingId: string, meetingPassword: string }`
- **Callback:** `(res: { success: boolean, error?: string, participants?: string[] }) => void`

### WebRTC Signaling

- **`peer-ready`** (Server → Client): Sent when two authorized participants are in the room. Includes peer details `{ peerId, peerName, peerRole }`.
- **`offer`** / **`answer`** / **`ice-candidate`** (Client ↔ Server ↔ Client): Forwarded to the peer for establishing WebRTC connection.

### Chat Events

- **`chat-message`** (Client → Server): `{ meetingId: "...", text: "..." }`
- **`chat-message`** (Server → Client): Broadcasts chat message to room `{ id, senderId, senderName, text, timestamp }`.
- **`chat-history`** (Server → Client): Sent upon joining if previous messages exist.

### Presence Events

- **`user-joined`** (Server → Client): Sent to existing participant when someone joins.
- **`user-disconnected`** (Server → Client): Peer temporarily disconnected (30s grace period).
- **`user-left`** (Server → Client): Peer left intentionally or grace period expired.
