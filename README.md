# Distilled

A content curation platform that pulls articles and posts from across the web and serves you a clean, personalized feed based on topics you actually care about.

Live at [distilled.blog](https://www.distilled.blog)

---

## What it does

You pick your topics, set how often you want updates (daily, weekly, or monthly), and Distilled fetches fresh content from sources like Reddit, Hacker News, dev.to, and RSS feeds. No algorithm pushing ads or rage bait, just the stuff you asked for.

You can like, save, and click through articles. The more you interact, the better the feed gets.

---

## Features

- Topic-based feed (you choose what you follow)
- Content from Reddit, Hacker News, dev.to, and RSS
- Save articles to read later
- Daily / weekly / monthly digest frequency
- Light and dark mode
- Admin panel for managing users and content
- Report system for flagging bad content

> **AI-powered summarization is coming soon.** The Gemini integration is built in but not active yet.

---

## Tech stack

- **Next.js 16** + React 19 + TypeScript
- **PostgreSQL** + **Prisma** for the database
- **Redis** + **BullMQ** for background content fetching
- **NextAuth** for authentication
- **Resend** for emails
- **Tailwind CSS** for styling

---

## Running locally

**Prerequisites:** Node.js, Docker

1. Clone the repo and go into the app folder:
   ```bash
   cd distilled/app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Start Postgres and Redis with Docker:
   ```bash
   cd ../docker
   docker-compose up -d
   ```

5. Run database migrations and seed data:
   ```bash
   cd ../app
   npx prisma migrate dev
   npm run db:seed
   ```

6. Start the dev server:
   ```bash
   npm run dev
   ```

7. In a separate terminal, start the content worker:
   ```bash
   npm run worker
   ```

The app will be at `http://localhost:3000`.

---

## Environment variables

You'll need these in your `.env`:

```
DATABASE_URL=
REDIS_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
```

---

## Deployment

The app is deployed on [Railway](https://railway.app) with separate services for the Next.js app, the BullMQ worker, Postgres, and Redis.

---

## Open for suggestions

If you have ideas for features, improvements, or anything you think would make Distilled better, feel free to open an issue or reach out. Always open to feedback.
