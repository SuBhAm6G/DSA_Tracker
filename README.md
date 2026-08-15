# DSA Tracker

A polished, production-quality DSA learning & progress-tracking web application.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase · Vercel

---

## Features

- **4 Progressive Curriculum Levels** sourced from `lists.txt` (308 topics, 73 modules)
- **GitHub-style Activity Heatmap** with per-day topic counts
- **Streak Tracking** — current streak, longest streak, active days
- **Optimistic UI** — checkboxes update instantly, roll back on failure
- **Global Search** — `Cmd+K` to search all topics
- **Topic Notes** — private per-topic notes with auto-save
- **Statistics** — cumulative progress chart, weekly bar chart, per-list breakdown
- **Data Export** — JSON and CSV
- **Reset Progress** — typed confirmation required
- **Authentication** — Google OAuth + Email/Password via Supabase
- **Row Level Security** — users can never access each other's data
- **Dark / Light / System theme**
- **Responsive** — works on mobile with sidebar drawer

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd DSA_Tracker
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier)
2. Note your **Project URL** and **anon key** from Settings → API
3. Also note the **service role key** (keep it secret)

### 3. Apply the Database Schema

In the Supabase Dashboard → SQL Editor, run these files **in order**:

```
1. supabase/schema.sql
2. supabase/rls.sql
```

### 4. Set Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Seed the Curriculum

```bash
# Parse lists.txt → app/data/curriculum.json
npm run parse-curriculum

# Upload curriculum to Supabase
npm run seed-curriculum
```

### 6. Configure Google OAuth (optional)

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Follow the instructions to create a Google Cloud OAuth client
3. Add `http://localhost:3000/auth/callback` to Authorized redirect URIs

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Vercel Deployment

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel Dashboard (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel domain, e.g. `https://dsa-tracker.vercel.app`)
4. Deploy
5. Add your Vercel domain to Supabase Auth → URL Configuration → Site URL
6. Add `https://your-domain.vercel.app/auth/callback` to Redirect URLs in Supabase Auth

---

## Updating the Curriculum

If `lists.txt` is updated:

```bash
# Re-parse
npm run parse-curriculum

# Re-seed (idempotent — won't duplicate, won't delete user progress)
npm run seed-curriculum
```

Topics with unchanged slugs will retain all user progress. New topics will appear as "Not Started".

---

## Project Structure

```
app/
  page.tsx              # Dashboard
  curriculum/
    page.tsx            # Curriculum index
    [listId]/page.tsx   # Per-list curriculum view
  activity/page.tsx     # Activity history
  statistics/page.tsx   # Stats & charts
  profile/page.tsx      # User profile
  settings/page.tsx     # Settings & data export
  auth/
    login/page.tsx      # Sign in
    register/page.tsx   # Sign up
    callback/route.ts   # OAuth callback
  data/
    curriculum.json     # Generated from lists.txt (do not edit manually)

components/
  AppShell.tsx          # Layout wrapper with topbar
  Sidebar.tsx           # Navigation sidebar
  Heatmap.tsx           # Activity heatmap
  TopicDrawer.tsx       # Topic detail slide-in panel
  SearchModal.tsx       # Global search modal
  ThemeProvider.tsx     # Light/dark/system theme context

hooks/
  useCurriculum.ts      # Main data hook (progress + curriculum merged)

lib/
  supabase/
    client.ts           # Browser Supabase client
    server.ts           # Server-side Supabase client
    types.ts            # TypeScript DB types
  utils.ts              # Date, streak, heatmap utilities

scripts/
  parse-curriculum.ts   # lists.txt → curriculum.json
  seed-curriculum.ts    # curriculum.json → Supabase

supabase/
  schema.sql            # All tables, indexes, triggers
  rls.sql               # Row Level Security policies
```

---

## Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| Vercel  | Unlimited deploys, 100GB bandwidth |
| Supabase DB | 500MB storage |
| Supabase Auth | 50,000 MAU |
| Supabase API | 5GB egress/month |

This app is designed to run comfortably within these limits.
