# ReviewEase AI

> Turn happy customers into Google reviews in seconds — QR-powered AI review generation for local businesses.

## What it does

Businesses place a QR code at their counter. Customers scan it, select a star rating, choose a review style, and AI generates 3 ready-made reviews. One tap copies the review and redirects to the Google review page. Done in 5 seconds.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| AI | OpenAI GPT / Google Gemini (auto-fallback) |
| Charts | Recharts |
| QR Code | qrcode.react |
| Animations | Framer Motion |
| Hosting | Vercel |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Firebase setup:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Enable Storage
6. Copy your config values into `.env.local`

**AI setup (optional — fallback reviews work without it):**
- OpenAI: Get key from [platform.openai.com](https://platform.openai.com/api-keys)
- Gemini: Get key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login
│   ├── register/page.tsx           # Register
│   ├── pricing/page.tsx            # Pricing page
│   ├── b/[slug]/page.tsx           # Customer review page (QR destination)
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard home
│   │   ├── businesses/page.tsx     # Business list
│   │   ├── businesses/new/page.tsx # Add business
│   │   ├── analytics/page.tsx      # Analytics
│   │   └── settings/page.tsx       # Settings
│   └── api/
│       └── generate-review/route.ts # AI review generation API
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── layout/                     # Navbar, Footer, DashboardLayout
│   ├── landing/                    # Landing page sections
│   ├── business/                   # Business card, form, QR modal
│   └── review/                     # Star rating, tone selector, review card
├── lib/
│   ├── firebase.ts                 # Firebase initialization
│   ├── auth-context.tsx            # Auth provider & hook
│   └── utils.ts                    # Utility functions
├── hooks/
│   ├── useBusinesses.ts            # Business CRUD hook
│   └── useAnalytics.ts             # Analytics data hook
├── types/index.ts                  # TypeScript types
└── data/mock.ts                    # Mock data (replace with Firestore)
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /businesses/{businessId} {
      allow read: if resource.data.active == true;
      allow write: if request.auth.uid == resource.data.ownerUid;
      allow create: if request.auth != null;
    }
    match /scan_logs/{id} {
      allow create: if true;
      allow read: if request.auth != null;
    }
    match /review_clicks/{id} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Customer Review Flow

1. Customer scans QR code → lands on `/b/[slug]`
2. Selects star rating (1–5)
3. Chooses review tone (Professional / Friendly / Hindi / Hinglish / Short)
4. AI generates 3 review options via `/api/generate-review`
5. Customer selects one → clicks "Copy & Review on Google"
6. Review copied to clipboard → redirected to `https://search.google.com/local/writereview?placeid=PLACE_ID`
7. Customer pastes and submits

---

## Connecting Firebase (replacing mock data)

The hooks in `src/hooks/` currently use mock data. To connect real Firestore:

1. Configure Firebase in `.env.local`
2. In `useBusinesses.ts`, replace the mock `setTimeout` with Firestore `collection` queries
3. In `useAnalytics.ts`, replace mock data with Firestore aggregation queries
4. The `auth-context.tsx` already has full Firebase Auth integration ready

---

## License

MIT
