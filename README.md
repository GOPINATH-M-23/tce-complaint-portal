# TCE Smart Complaint Portal

A full-stack complaint management system for **Thiagarajar College of Engineering (TCE), Madurai**.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Firebase (Auth + Firestore) · Cloudinary (image storage)

---

## Project Structure

```
tce-smart-complaint-portal/
├── public/
│   ├── index.html
│   └── _redirects              ← Netlify SPA routing fix
├── src/
│   ├── assets/
│   │   ├── tce-logo.png
│   │   └── tce-campus.png
│   ├── components/
│   │   ├── charts/             ← Bar, Doughnut, Line, Priority charts
│   │   ├── forms/
│   │   │   ├── ComplaintForm.jsx   ← Cloudinary upload + progress
│   │   │   └── LoginForm.jsx       ← Email + Google OAuth
│   │   ├── ui/                 ← Badge, Modal, StatCard, Spinner, etc.
│   │   ├── AdminSidebar.jsx
│   │   ├── StudentSidebar.jsx
│   │   ├── ComplaintRow.jsx
│   │   ├── MobileHeader.jsx    ← Dark mode pill toggle + Google avatar
│   │   └── Navbar.jsx
│   ├── context/
│   │   ├── AuthContext.jsx     ← Persistent login (email + Google)
│   │   ├── ComplaintContext.jsx
│   │   └── ThemeContext.jsx
│   ├── firebase/
│   │   ├── config.js           ← Firebase init (reads from .env)
│   │   ├── auth.js             ← Email login, Google OAuth, signup
│   │   └── complaints.js       ← Firestore + Cloudinary upload
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useComplaints.js
│   ├── layouts/
│   │   ├── AdminLayout.jsx
│   │   └── StudentLayout.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AllComplaints.jsx
│   │   │   ├── ComplaintDetail.jsx ← Cloudinary image viewer
│   │   │   ├── StudentManagement.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── AdminSettings.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   ├── NewComplaint.jsx
│   │   │   ├── StudentNotifications.jsx ← Rich realtime alerts
│   │   │   └── StudentProfile.jsx      ← Shows phone, regNo, Google photo
│   │   ├── LandingPage.jsx
│   │   ├── StudentLogin.jsx
│   │   ├── AdminLogin.jsx
│   │   └── StudentSignup.jsx    ← Phone, regNo, Google signup
│   ├── routes/
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── authErrors.js       ← Friendly Firebase error messages
│   │   ├── cloudinary.js       ← Upload + compress + validate
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── firestore.rules
├── tailwind.config.js
├── vite.config.js
├── postcss.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloudinary (free image hosting)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### 3. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project `tce-complaint-portal`
3. **Authentication → Sign-in methods:**
   - Enable **Email/Password**
   - Enable **Google**
4. **Firestore Database** → Create in production mode
5. **Apply security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Register a Web App → copy config to `.env`

**Create first admin** in Firestore console:
- Firebase Auth → Add user: `admin@tce.edu` / `admin123`
- Firestore → `admins` collection → document ID = Firebase UID:
  ```json
  {
    "uid": "<firebase-uid>",
    "name": "Dr. S. Rajkumar",
    "email": "admin@tce.edu",
    "role": "Admin",
    "dept": "Principal Office"
  }
  ```

### 4. Cloudinary setup

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Dashboard → Settings → Upload → **Upload Presets**
3. Click **Add upload preset** → Mode: **Unsigned**
4. Set preset name (e.g. `tce_portal_unsigned`)
5. Copy your **Cloud Name** and preset name to `.env`

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Deploy to Netlify

```bash
npm run build
```

Upload `dist/` folder to Netlify, or connect your Git repo.

The `public/_redirects` file handles SPA routing automatically — no broken routes on refresh.

---

## Features

### Authentication
- Email/password login (student + admin)
- **Google OAuth** ("Continue with Google") for students
- Persistent sessions via Firebase
- Friendly error messages (no raw Firebase codes)
- Auto-redirect by role after login

### Student
- Signup with name, email, phone, registration number, dept, year
- Google signup with extra profile completion step
- Submit complaints with Cloudinary image upload (drag-drop, preview, progress bar)
- Real-time complaint tracking
- Rich notification system (submitted / reply / status update / resolve)
- Mark notifications read / mark all read
- Profile page with Google photo

### Admin
- Full complaint management (status, priority, reply)
- Student management (create, activate, deactivate)
- Real-time Analytics dashboard (4 charts)
- CSV export
- Dark mode toggle

### Technical
- Dark/light mode (localStorage persistent, smooth transition)
- Mobile bottom navigation with FAB
- Mobile-first responsive design
- Complaint ID hidden from UI (backend-only tracking)
- Cloudinary image compression before upload
- Smart priority auto-escalation
- Netlify SPA routing (`_redirects`)

---

## Smart Priority System

| Same-category complaints | Priority |
|--------------------------|----------|
| 0–1                      | Low      |
| 2–3                      | Medium   |
| 4–7                      | High     |
| 8+                       | Critical |

Thresholds configurable in `src/utils/constants.js`.

---

## Notification Types

| Type               | Trigger                          |
|--------------------|----------------------------------|
| `submitted`        | Student submits a complaint      |
| `status_update`    | Admin changes status             |
| `reply`            | Admin adds a reply               |
| `reply_and_status` | Admin updates both simultaneously|

---

## Theme

| Token          | Value     |
|----------------|-----------|
| Dark Green     | `#1f4d3a` |
| Green          | `#2e6b52` |
| Light Green    | `#3d8c6a` |
| Cream          | `#f7f5ef` |
| Font (display) | Playfair Display |
| Font (body)    | DM Sans   |

Tamil motto **"வினையே உயிர்"** preserved on landing and profile pages.
