<div align="center">

# DSA Tracker

**A focused Data Structures and Algorithms progress tracker built for students preparing for placements, OAs, internships, and product-company interviews.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Live Demo](https://dsatracker-seven.vercel.app/) · [Report Bug](https://github.com/SuBhAm6G/DSA_Tracker/issues) · [Request Feature](https://github.com/SuBhAm6G/DSA_Tracker/issues)

</div>

## Why I Built This

DSA preparation can feel scattered for students: one sheet for arrays, another for graphs, random notes elsewhere, and no clear sense of whether you are actually interview-ready.

I built DSA Tracker to make that journey calmer and more structured. It gives students one place to follow a curated curriculum, track topic and subtopic progress, build consistency, and see their preparation improve over time.

The goal is simple: help students spend less energy organizing prep and more energy solving problems.

## What It Helps Students Do

- Follow a structured DSA roadmap split across progressive preparation levels.
- Track topic, concept, and list-wise completion.
- Build consistency with streaks, activity history, and a contribution-style heatmap.
- Personalize the curriculum by primary programming language.
- Keep lightweight notes for topics while revising.
- Understand readiness for data roles, placement OAs, and product-company interviews.
- Export progress data whenever needed.

## Curriculum

The curriculum is organized into four student-friendly tracks:

| Track | Focus |
| --- | --- |
| Data Roles | Python-first problem solving, math, statistics-oriented patterns |
| Placement OAs | High-frequency arrays, strings, hashing, sorting, and speed-building topics |
| MAANG / Product | Trees, graphs, dynamic programming, recursion, and deeper interview patterns |
| Very High Tier | Advanced DSA and competitive programming style concepts |

## Features

| Area | Details |
| --- | --- |
| Dashboard | Overall completion, current streak, daily progress, next topic, and recent activity |
| Curriculum | Expandable modules, filters, topic/subtopic progress, and quick completion controls |
| Milestones | Career-oriented readiness cards for student goals |
| Analytics | Heatmap, weekly activity, cumulative progress, and list breakdowns |
| Profile | Student progress summary and account details |
| Settings | Theme, language preference, reset controls, and data export |

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** React, custom CSS, Lucide React
- **Charts:** Recharts
- **Backend:** Supabase Auth + PostgreSQL
- **Deployment:** Vercel

## Local Setup

```bash
git clone https://github.com/SuBhAm6G/DSA_Tracker.git
cd DSA_Tracker
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Set up Supabase:

```text
1. Create a Supabase project.
2. Run supabase/schema.sql in the SQL editor.
3. Run supabase/rls.sql to enable row-level security policies.
4. Enable GitHub OAuth in Supabase Auth if you want social login.
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment Notes

The app is ready for Vercel. Add these environment variables in the Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If using GitHub OAuth, add your deployed domain to the Supabase redirect URLs.

## Student-First Philosophy

This project is made for students who want a practical, distraction-free way to prepare for interviews. It is not meant to be another overwhelming sheet. It is meant to be a companion that shows what to do next, what has already been done, and how far the student has come.

<div align="center">

Built by [SuBhAm Dhar](https://github.com/SuBhAm6G) for students preparing seriously, one topic at a time.

</div>
