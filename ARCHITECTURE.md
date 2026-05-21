# TCE Smart Complaint Portal — Production Architecture

## Table of Contents
1. [Current Architecture Weaknesses](#1-current-architecture-weaknesses)
2. [New Architecture Overview](#2-new-architecture-overview)
3. [Signed Upload Flow](#3-signed-upload-flow)
4. [Security Improvements](#4-security-improvements)
5. [Scalability Improvements](#5-scalability-improvements)
6. [Concurrent User Handling](#6-concurrent-user-handling)
7. [Environment Variables](#7-environment-variables)
8. [Deployment Steps](#8-deployment-steps)
9. [Monitoring & Observability](#9-monitoring--observability)

---

## 1. Current Architecture Weaknesses

### 1.1 Unsigned Cloudinary Uploads
```
BEFORE (insecure):
  Browser → Cloudinary (with upload_preset in VITE_ env var)

Problems:
  ✗ VITE_ variables are bundled into client JS — anyone can read them
  ✗ Anyone who finds your upload_preset can upload arbitrary content to your account
  ✗ No authentication on who can upload
  ✗ No rate limiting on upload volume
  ✗ Could exhaust your free Cloudinary quota in minutes
```

### 1.2 Direct Firestore Writes from Client
```
BEFORE:
  Client → Firestore directly using firebase SDK

Problems:
  ✗ Client can manipulate priority, status, studentId fields before write
  ✗ No server-side validation of category/status enums
  ✗ Business logic (auto-priority calculation) runs in browser — tamper-able
  ✗ No rate limiting on complaint submission
  ✗ No spam protection
```

### 1.3 No Firebase Token Verification on API Calls
```
BEFORE:
  All auth enforcement was in Firestore rules only

Problems:
  ✗ Firestore rules can have edge cases and bugs
  ✗ No single point of auth enforcement
  ✗ Admin SDK not available client-side (no privilege escalation protection)
```

### 1.4 No Backend Error Handling
```
BEFORE:
  Raw Firebase error codes shown to users (auth/user-not-found, etc.)
  No centralized logging
  No request tracing

Problems:
  ✗ Exposes internal implementation details to users
  ✗ No visibility into failures
  ✗ Hard to debug production issues
```

### 1.5 No Content Security Policy
```
BEFORE:
  No CSP headers

Problems:
  ✗ XSS attacks can load external scripts
  ✗ Clickjacking via iframes
  ✗ Data exfiltration via injected code
```

---

## 2. New Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Firebase    │  │ React Query  │  │ Cloudinary Direct      │  │
│  │ Auth SDK    │  │ (caching)    │  │ Upload (signed)        │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬─────────────┘  │
└─────────┼────────────────┼──────────────────────┼──────────────┘
          │ ID Token        │ REST calls            │ Binary upload
          ▼                 ▼                       ▼
┌─────────────────────────────────────┐    ┌───────────────────┐
│          Netlify Functions          │    │   Cloudinary CDN  │
│  ┌────────────────────────────────┐ │    │  (image storage)  │
│  │  Auth Middleware               │ │    └───────────────────┘
│  │  Rate Limiter (per-IP)         │ │
│  │  Input Validators              │ │
│  │  Structured Logger             │ │
│  └────────────┬───────────────────┘ │
│               │ Admin SDK           │
│               ▼                     │
│  ┌────────────────────────────────┐ │
│  │  Firebase Admin SDK            │ │
│  │  (bypasses Firestore rules)    │ │
│  └────────────┬───────────────────┘ │
└───────────────┼─────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│                      Google Firebase                           │
│  ┌──────────────────┐        ┌──────────────────────────────┐ │
│  │  Authentication  │        │  Firestore Database          │ │
│  │  (ID tokens)     │        │  (last-line security rules)  │ │
│  └──────────────────┘        └──────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Function Directory Structure
```
netlify/
└── functions/
    ├── _middleware/
    │   ├── auth.js          ← Firebase token verification
    │   └── rateLimit.js     ← Per-IP rate limiting
    ├── _utils/
    │   ├── firebaseAdmin.js ← Admin SDK singleton
    │   ├── cloudinarySigned.js ← Server-side signed upload
    │   ├── response.js      ← Consistent HTTP responses + CORS
    │   └── logger.js        ← Structured JSON logging
    ├── _validators/
    │   └── complaint.js     ← Input sanitization + validation
    ├── health.js            ← GET /api/health
    ├── upload-signature.js  ← POST /api/upload-signature
    ├── upload-image.js      ← POST /api/upload-image
    ├── submit-complaint.js  ← POST /api/submit-complaint
    ├── update-complaint.js  ← PUT  /api/update-complaint
    ├── get-complaints.js    ← GET  /api/get-complaints
    └── manage-student.js    ← POST /api/manage-student
```

---

## 3. Signed Upload Flow

### Flow A: Two-Step (Recommended — used in production)
```
1. User selects image in browser
2. Client validates file locally (type, size)
3. Client compresses image (canvas API, ≤1200px, quality 0.82)
4. Client calls: POST /api/upload-signature
     Headers: Authorization: Bearer <firebase-id-token>
     Body:    { complaintId }
5. Server: verifies token → rate-limits → generates HMAC-SHA256 signature
     Signature = SHA256(folder=X&timestamp=Y&CLOUDINARY_API_SECRET)
6. Server returns: { signature, timestamp, apiKey, cloudName, folder }
7. Client uploads directly to Cloudinary using these params:
     POST https://api.cloudinary.com/v1_1/<cloud>/image/upload
     FormData: { file, signature, timestamp, api_key, folder }
8. Cloudinary verifies signature on their server — rejects if tampered
9. Cloudinary returns { secure_url, public_id }
10. Client stores imageUrl + publicId with the complaint

Security guarantees:
  ✓ API_SECRET never leaves the server
  ✓ Signature is time-bound (valid ~1 hour)
  ✓ Only authenticated users get signatures
  ✓ Rate-limited to 15 signatures per 15 minutes per IP
  ✓ Binary upload goes directly to Cloudinary (no Netlify bandwidth)
```

### Flow B: Full Server Upload (Alternative — used for small files)
```
1. Client converts image to base64
2. Client POSTs { imageData, mimeType, complaintId } + token to /api/upload-image
3. Server: verifies token → validates image → uploads to Cloudinary via Admin REST API
4. Server: updates Firestore complaint with imageUrl
5. Server returns { imageUrl, publicId }

Tradeoff:
  ✓ Maximum control — image never touches client CDN
  ✗ Base64 increases size ~33% — limited by Netlify's 6 MB body limit
  ✗ All bandwidth through Netlify (counts toward limits)
  Use for: admin uploads, server-triggered uploads, very small images
```

---

## 4. Security Improvements

### 4.1 Content Security Policy (netlify.toml)
```
CSP prevents:
  ✓ XSS — script-src 'self' blocks injected <script> tags
  ✓ Clickjacking — frame-ancestors 'none' + X-Frame-Options: DENY
  ✓ Data exfiltration — connect-src whitelist blocks unknown endpoints
  ✓ MIME confusion — X-Content-Type-Options: nosniff
  ✓ Protocol downgrade — HSTS forces HTTPS for 1 year

Images allowed from:
  ✓ res.cloudinary.com (complaint images)
  ✓ lh3.googleusercontent.com (Google profile photos)
  ✓ firebasestorage.googleapis.com (legacy)
```

### 4.2 Firebase Token Verification
```javascript
// Every protected function does this:
const decoded = await auth.verifyIdToken(idToken, true)
//                                                ^^^^ checkRevoked: true
// Rejects tokens that have been explicitly revoked
// Verifies: signature, expiry, issuer, audience
// Role comes from Firestore — NOT from token claims (admin impersonation impossible)
```

### 4.3 Rate Limiting
```
Action         Max    Window    Scope
upload         10     15 min    per IP
complaint      5      10 min    per IP
auth           20     5 min     per IP
signature      15     15 min    per IP

Implementation: in-memory per function instance (soft limit)
For hard distributed limits: add Upstash Redis ($0 free tier)
```

### 4.4 Input Sanitization
```javascript
// All string inputs are:
const sanitizeStr = (val, maxLen) =>
  String(val).trim().replace(/\s+/g, ' ').slice(0, maxLen)

// Category is validated against a server-side enum (not client list)
// Status and Priority are validated against server-side enums
// Student ID format validated with regex: /^\d{2}[a-z]{2}\d{3}$/i
// Phone validated: /^[6-9]\d{9}$/
```

### 4.5 CORS Policy
```javascript
// Only these origins get CORS headers:
const ALLOWED_ORIGINS = [
  process.env.APP_URL,       // e.g. https://tce-portal.netlify.app
  'http://localhost:5173',   // Vite dev
  'http://localhost:8888',   // netlify dev
]
// All other origins get no CORS headers → browser blocks the request
```

---

## 5. Scalability Improvements

### 5.1 Firestore Read Optimization

**Before:** `getDocs(query)` — reads ALL matching documents
**After:** `count().get()` — reads only the count (1 read unit regardless of matches)

```javascript
// Priority calculation — BEFORE (reads N documents):
const snap = await getDocs(query(collection(db, 'complaints'), where('category','==',cat)))
const count = snap.size  // Charged N reads for N documents

// Priority calculation — AFTER (reads 1 unit):
const snap = await db.collection('complaints').where('category','==',cat).count().get()
const count = snap.data().count  // Charged 1 read regardless of count
```

### 5.2 Cursor-Based Pagination
```javascript
// get-complaints.js implements cursor pagination:
// ?limit=20&cursor=<lastDocId>

// BEFORE: fetch all complaints at once
// - 500 complaints = 500 reads per page load
// - Each admin page load costs 500 reads

// AFTER: fetch 20 at a time
// - First page = 21 reads (20 + 1 to check hasMore)
// - Next page uses cursor (startAfter) = 21 reads
// - 90% read cost reduction for large complaint sets
```

### 5.3 Cloudinary Image Optimization
```
All images are served through Cloudinary CDN with these optimizations:

Use these URL transforms in <img> tags:
  https://res.cloudinary.com/<cloud>/image/upload/
    f_auto/          ← Auto format (WebP for Chrome, AVIF for modern browsers)
    q_auto:good/     ← Auto quality (Cloudinary AI picks optimal)
    w_400,c_limit/   ← Max 400px for thumbnails
    <public_id>

In ComplaintRow.jsx (thumbnail):
  f_auto,q_auto:good,w_200,c_limit

In ComplaintDetail.jsx (full view):
  f_auto,q_auto:good,w_1200,c_limit
```

### 5.4 Firestore Composite Indexes
```
Add these indexes in Firebase Console → Firestore → Indexes:

For student complaint listing (most common query):
  Collection: complaints
  Fields: studentId ASC, createdAt DESC

For admin filtered listing:
  Collection: complaints
  Fields: category ASC, createdAt DESC

  Collection: complaints
  Fields: status ASC, createdAt DESC

  Collection: complaints
  Fields: priority ASC, createdAt DESC

For notifications:
  Collection: notifications
  Fields: userId ASC, createdAt DESC
  Fields: userId ASC, read ASC, createdAt DESC
```

### 5.5 Frontend Performance
```
React optimizations already in place + recommended additions:

1. Debounce search inputs (already implemented)
   useEffect with 300ms delay on search string

2. Memo-ize expensive components:
   const ComplaintRow = React.memo(({ complaint, isAdmin, onClick }) => { ... })

3. Lazy load admin pages (code splitting):
   const Analytics = React.lazy(() => import('@/pages/admin/Analytics'))
   const AllComplaints = React.lazy(() => import('@/pages/admin/AllComplaints'))
   Wrap routes in <Suspense fallback={<Spinner />}>

4. Virtualize long complaint lists (react-window):
   npm install react-window
   <FixedSizeList height={600} itemCount={complaints.length} itemSize={80}>
     {({ index, style }) => <ComplaintRow style={style} complaint={complaints[index]} />}
   </FixedSizeList>

5. Real-time listener optimization:
   Current onSnapshot listeners fire on every change.
   Add useCallback wrapper to prevent re-subscription on parent re-renders.
```

---

## 6. Concurrent User Handling

### How Netlify Serverless Auto-Scales
```
Traditional server:
  1 server instance → handles N concurrent requests → bottleneck

Netlify Functions (AWS Lambda under the hood):
  1 request → 1 function instance (isolated)
  100 concurrent requests → 100 function instances (auto-spawned)
  0 requests → 0 instances (no idle cost)

This means:
  ✓ Zero configuration for scaling
  ✓ No load balancer to set up
  ✓ Handles traffic spikes automatically (exam season, complaint bursts)
  ✓ You pay only for actual compute time, not idle time

Limits (Netlify free tier):
  - 125,000 function invocations per month
  - 100 GB bandwidth per month
  - 10 second execution timeout
  For a college portal (~500 students), this is more than sufficient.
```

### Cold Start Mitigation
```
Cold start: first request to a new function instance takes ~200-500ms extra
            because Node.js + Firebase Admin SDK need to initialize.

Mitigation strategies:
  1. Singleton pattern for Firebase Admin (already implemented in firebaseAdmin.js)
     - Warm instances reuse the initialized app
     - Only the first request per instance pays the init cost

  2. Firebase Admin SDK initialization is ~50ms on warm re-use

  3. For Netlify Pro: enable "Functions Background Tasks" for long operations

  4. For very high traffic: Netlify Edge Functions (V8 isolates, ~0ms cold start)
     - Trade-off: limited Node.js API surface
```

### Firestore Concurrency
```
Firestore handles concurrent writes natively:
  ✓ Atomic batch writes (used in submit-complaint.js and update-complaint.js)
    Complaint + notification write in a single atomic operation
    Either both succeed or both fail — no partial state

  ✓ Document-level locking (Firestore handles this automatically)
    Two admins updating the same complaint won't corrupt data

  ✓ Real-time listeners (onSnapshot) use long-polling
    Firebase handles multiplexing thousands of concurrent listeners
    Each listener costs ~1 Firestore read per change event
```

---

## 7. Environment Variables

### Frontend (VITE_ prefix — bundled into client JS, public)
```env
VITE_FIREBASE_API_KEY          Firebase web app API key (safe to expose)
VITE_FIREBASE_AUTH_DOMAIN      Firebase auth domain
VITE_FIREBASE_PROJECT_ID       Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET   Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID  Firebase messaging sender
VITE_FIREBASE_APP_ID           Firebase app ID
VITE_CLOUDINARY_CLOUD_NAME     Your Cloudinary cloud name (safe to expose)
```

### Backend (no prefix — Netlify function env only, secret)
```env
CLOUDINARY_CLOUD_NAME          Same cloud name (server-side reference)
CLOUDINARY_API_KEY             Cloudinary API key — NEVER expose to client
CLOUDINARY_API_SECRET          Cloudinary API secret — NEVER expose to client

FIREBASE_PROJECT_ID            Firebase project ID
FIREBASE_CLIENT_EMAIL          Service account email
FIREBASE_PRIVATE_KEY           Service account private key (RSA)

RATE_LIMIT_MAX_UPLOADS         Max uploads per IP per window (default: 10)
RATE_LIMIT_WINDOW_MS           Window duration in ms (default: 900000 = 15min)
APP_URL                        Your Netlify URL for CORS validation
NODE_ENV                       "production" on Netlify
```

### Why Firebase config is safe to expose
```
Firebase API keys are NOT secret keys — they are identifiers that tell the
Firebase SDK which project to connect to. Security is enforced by:
  - Firebase Authentication (only valid users get tokens)
  - Firestore Security Rules (only authorized reads/writes succeed)
  - Admin SDK on server (privileged operations require service account)

Google publicly documents this: https://firebase.google.com/docs/projects/api-keys
```

---

## 8. Deployment Steps

### Prerequisites
```bash
npm install -g netlify-cli firebase-tools
```

### Step 1: Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project (select Firestore)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### Step 2: Firebase Service Account
```
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy these fields to Netlify env vars:
   - project_id         → FIREBASE_PROJECT_ID
   - client_email       → FIREBASE_CLIENT_EMAIL
   - private_key        → FIREBASE_PRIVATE_KEY (entire multi-line string)
```

### Step 3: Cloudinary Setup
```
1. Sign up at cloudinary.com (free tier)
2. Dashboard → Note your "Cloud Name"
3. Settings → Access Keys → note API Key and API Secret
4. Settings → Upload → Upload Presets → Add Unsigned Preset (for legacy fallback)
   Name it: tce_portal_unsigned
5. Add to Netlify env vars:
   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

### Step 4: Netlify Deployment
```bash
# Connect repo to Netlify (GUI or CLI)
netlify init

# Set all environment variables
netlify env:set CLOUDINARY_API_KEY "your_key"
netlify env:set CLOUDINARY_API_SECRET "your_secret"
netlify env:set CLOUDINARY_CLOUD_NAME "your_cloud"
netlify env:set FIREBASE_PROJECT_ID "your_project"
netlify env:set FIREBASE_CLIENT_EMAIL "firebase-adminsdk@..."
netlify env:set FIREBASE_PRIVATE_KEY "-----BEGIN RSA..."
netlify env:set APP_URL "https://your-site.netlify.app"
netlify env:set NODE_ENV "production"

# Deploy
npm run build
netlify deploy --prod
```

### Step 5: Local Development
```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Fill in your values

# Run with Netlify Dev (emulates functions locally)
netlify dev
# Opens at http://localhost:8888
# Functions available at http://localhost:8888/.netlify/functions/
# (or http://localhost:8888/api/ via redirects)
```

### Step 6: Verify Deployment
```bash
# Check health endpoint
curl https://your-site.netlify.app/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","checks":{"firebase":true,"cloudinary":true},...}}
```

---

## 9. Monitoring & Observability

### Netlify Function Logs
```
Netlify Dashboard → Functions → Select function → View logs
All logger.info/warn/error calls appear here in JSON format.
```

### Key metrics to monitor
```
1. Function error rate      → Netlify Dashboard → Functions → Error rate
2. Function duration        → Watch for approaching 10s timeout
3. Cloudinary usage         → Cloudinary Dashboard → Usage
4. Firebase reads/writes    → Firebase Console → Usage
5. Auth failures            → logger.warn('Token verification failed') entries
6. Rate limit hits          → logger.warn('Rate limit exceeded') entries
```

### Firestore Usage Optimization Budget
```
Free tier limits (Spark plan):
  50,000 reads/day
  20,000 writes/day
  20,000 deletes/day
  1 GB storage

For TCE portal (~500 students, 100 complaints/day):
  Estimated reads/day:
    - Dashboard loads: 500 × 20 reads = 10,000
    - Real-time listeners: ~5,000 (onSnapshot events)
    - Admin page loads: 50 × 50 reads = 2,500
    Total: ~17,500 reads/day (within free limit)

  To stay within budget:
    ✓ Use count() instead of full collection reads (already done)
    ✓ Paginate complaint lists (already done)
    ✓ Debounce real-time listeners
    ✓ Cache complaint data in React Query (recommend adding)
```
