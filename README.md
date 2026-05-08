# ⏱️ TimeNotes

TimeNotes is a high-density, professional time-tracking and note-taking application designed for efficiency. Built with **React 19**, **TypeScript**, and **Vite**, it utilizes **Turso DB** for global data persistence and is optimized for deployment on **Cloudflare Pages**.

## 🚀 Key Features

- **Google-style Calendar**: A monthly overview with color-coded project pills and integrated note indicators.
- **Ultra-Compact Timesheet**: High-density list views with tight typography (`leading-[1.1]`) and zero-margin formatting for maximum information display.
- **Integrated Side Panels**: View and edit time entries or notes without leaving your current view using professional side-panel overlays.
- **Unified Dashboard**: A central command center combining productivity charts, recent activity, and a monthly activity calendar.
- **Mobile Optimized**: Responsive design featuring a bottom navigation bar, mobile-dedicated edit pages, and a "Scroll-to-Top" FAB.
- **Automatic Quality Control**: Integrated **Husky** and **Prettier** hooks that ensure all pushed code follows a consistent style.

## 🛠️ Tech Stack

- **Frontend**: React 19 (Compiler enabled), TypeScript, Vite
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Database**: Turso (libSQL)
- **Deployment**: Cloudflare Pages (via Wrangler)
- **Formatting**: Prettier + Husky (pre-push hooks)

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh) or [Node.js](https://nodejs.org) installed.

### 2. Installation
```bash
bun install
```

### 3. Database Setup (Turso)
TimeNotes uses Turso for its edge-ready database.
1. Create a database via [Turso CLI](https://docs.turso.tech/cli/introduction) or the [Dashboard](https://turso.tech).
2. Copy your **Database URL** and **Auth Token**.
3. Create a `.env` file in the root directory (use `.env.example` as a template):
```bash
VITE_TURSO_DATABASE_URL=libsql://your-database-name.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token-here
```

### 4. Development
```bash
bun dev
```

## 🌍 Deployment

TimeNotes is optimized for **Cloudflare Pages**.

### Deploy via Wrangler
Ensure you are logged into Wrangler:
```bash
npx wrangler login
```

Run the deployment script:
```bash
npm run cf:deploy
```
This will build the production bundle and deploy it to your Cloudflare account.

## 📐 Development Standards

### Formatting
We use **Prettier** for code consistency. A **Husky pre-push hook** is active to ensure no unformatted code is pushed to the repository.

- **Manual Format**: `npm run format`
- **Style Check**: `npm run format:check`

### Architecture
The project follows a **Feature-Driven Architecture**:
- `src/features/`: Contains modular business logic (dashboard, notes, timesheet).
- `src/components/ui/`: Shared UI components (shadcn/ui).
- `src/lib/turso/`: Database client configuration.
- `src/lib/api/`: Repository patterns for data access.

---
Built with ❤️ for high-performance productivity.
