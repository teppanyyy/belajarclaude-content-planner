# IG Content Planner

A small Next.js app for planning Instagram content: add a topic, generate a caption + AI image prompt with Claude, and track everything on a live timeline.

## Stack

- Next.js 14 (App Router) + Tailwind CSS
- Postgres via Prisma (works with Vercel Postgres, Neon, or Supabase)
- Anthropic API (Claude) for caption + image prompt generation

## Pages

- `/new` — enter a theme + topic, generate a caption and image prompt, edit, then save.
- `/timeline` — table of all posts, done checkbox, progress bar, copy-to-clipboard actions. Reads straight from the database and revalidates automatically whenever a post is added or updated — no manual refresh needed.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string
   - `ANTHROPIC_API_KEY` — your Anthropic API key
3. Push the schema to your database:
   ```bash
   npm run db:push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. Add a Postgres database: Vercel dashboard → Storage → Create Database → Postgres (or connect Neon/Supabase). Vercel will inject `DATABASE_URL` automatically for Vercel Postgres — otherwise add it yourself in Project Settings → Environment Variables.
4. Add `ANTHROPIC_API_KEY` in Project Settings → Environment Variables.
5. Deploy. After the first deploy, run `npx prisma db push` once (locally, pointed at the production `DATABASE_URL`, or via a one-off Vercel deployment hook) to create the `Post` table.

## Extending later

- Swap the `theme` field for a proper enum/table if you want a fixed set of categories.
- Add image upload (e.g. Vercel Blob) if you want to attach real media rather than just an AI image prompt.
- Add a scheduled-posting integration (Meta Graph API) to auto-publish instead of copy/paste.
