# Personal Assistant

A modern personal productivity dashboard built with Next.js 14, Prisma, and SQLite.

## Features

- **Projects & Tasks Management** - Organize work with projects and todos
- **Meeting Scheduler** - Track upcoming meetings
- **News Feed** - Stay updated with latest news (30+ categories)
- **Weather Forecast** - 7-day weather for Hanoi
- **Stock Ticker** - Real-time HPG stock prices
- **Notepad** - Quick notes with auto-save

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite + Prisma ORM
- **Authentication**: Web Crypto API sessions
- **Styling**: Custom CSS with luxury minimalism aesthetic
- **APIs**: VnDirect (stocks), Google News RSS, Open-Meteo (weather)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pta20032004/personal-assistant.git
cd personal-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `OWNER_PASSWORD` - Your login password
- `SESSION_SECRET` - Random 32-byte hex string (generate with `openssl rand -hex 32`)

4. Initialize database:
```bash
npx prisma migrate deploy
```

5. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your password.

## Deployment on Vercel

1. Push your code to GitHub

2. Import project on Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. Configure environment variables:
   - `OWNER_PASSWORD` - Your login password
   - `SESSION_SECRET` - Random secret key
   - `DATABASE_URL` - Vercel will auto-configure Postgres

4. Deploy!

## Database

Uses SQLite for local development. For production on Vercel, you'll need to:
- Use Vercel Postgres (recommended)
- Or use another PostgreSQL provider (Supabase, Neon, etc.)

Update `prisma/schema.prisma` datasource for PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate deploy
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI

## License

MIT
