<div align="center">

# ⚔️ DSA Progress Tracker

A stunning, gamified, and highly opinionated Data Structures & Algorithms tracker built for Engineering Students. Go from **Peasant Recruit** to **Kingslayer** as you prepare for Placement OAs, Data Roles, and MAANG Interviews.

[Report Bug](https://github.com/SuBhAm6G/DSA_Tracker/issues) · [Request Feature](https://github.com/SuBhAm6G/DSA_Tracker/issues)

</div>

<br />

## 🌟 Why this exists

Preparing for software engineering interviews is a massive, multi-month marathon. Most students lose motivation or track of their progress halfway through. 

This tracker was built to solve that. It breaks down the monumental task of learning DSA into 4 highly-curated, tactical lists and wraps the entire experience in a beautiful, dark-mode, gamified platform. Every subtopic you master pushes you closer to your dream role.

---

## 🔥 Features

- **🏆 Gamified Knight Progression:** An integrated 15-tier ranking system. Track your growth from a *Peasant Recruit* (Level 1) all the way to a *Kingslayer* (Level 15) as you master new topics.
- **🎯 Milestone Trackers:** Glassmorphism target boxes constantly keep your goals in sight:
  - *Data Role Ready* (Python-first, algorithmic focus)
  - *Placement Ready* (Indian Placement OAs)
  - *MAANG Ready* (Product-based company deep dive)
- **🔥 Streaks & Heatmap:** A GitHub-style contribution heatmap and daily streak tracker to keep you coding consistently every single day.
- **📝 Language Personalization:** Choose your primary weapon (C++, Java, Python, JavaScript, etc.).
- **🔒 Seamless Authentication:** 1-click GitHub login powered by Supabase.
- **✨ Premium UI/UX:** Built with Next.js, featuring Neo-brutalist styling, smooth micro-animations, and beautifully crafted components using Plus Jakarta Sans.

---

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (v18+) and a [Supabase](https://supabase.com/) account for the database and authentication.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SuBhAm6G/DSA_Tracker.git
   cd DSA_Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project.
   - Run the SQL script found in `supabase/schema.sql` (and `supabase/rls.sql`) to set up your tables and Row Level Security.
   - Enable GitHub OAuth in your Supabase Auth settings.

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 The Curriculum

The curriculum is heavily curated and separated into 4 primary tactical lists:
1. **Data Roles:** Focuses on Python, mathematical algorithms, and statistical patterns.
2. **Indian Placement OAs:** Broad, heavy emphasis on Arrays, Strings, and general problem-solving speed required for mass-hiring OAs.
3. **MAANG / Product:** Deep focus on Trees, Graphs, Dynamic Programming, and System Design concepts.
4. **Very High Tier:** Competitive Programming concepts (Segment Trees, Advanced Graph Theory, Complex DP).

*Curriculum logic is dynamically parsed from markdown files and mapped directly into the database!*

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, TypeScript
- **Styling:** Custom Vanilla CSS (Neo-brutalist & Glassmorphism themes)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

<div align="center">
  <i>Created and Maintained by <a href="https://github.com/SuBhAm6G">SuBhAm Dhar</a></i>
</div>
