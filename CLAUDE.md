# Reconic - SaaS for YouTube Creators

## Project Overview
Reconic is a SaaS platform for YouTube creators featuring research dashboards, video asset editing, and AI-powered tools.

## Tech Stack
- **Framework**: Next.js (App Router, TypeScript, Tailwind CSS, ESLint)
- **UI**: shadcn/ui + lucide-react icons
- **Auth & DB**: Supabase (@supabase/supabase-js, @supabase/ssr)
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **AI**: Vercel AI SDK with Google Gemini (@ai-sdk/google, ai)

## Initialization Plan

### Step 1: Create Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --turbopack
```
- No React Compiler, no src/ directory

### Step 2: Install Dependencies
```bash
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install @ai-sdk/google ai
npm install lucide-react
```

### Step 3: Environment Setup
Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
YOUTUBE_DATA_API_KEY=your-youtube-api-key
```

### Step 4: Supabase Client Setup
- `lib/supabase/client.ts` — browser client using createBrowserClient
- `lib/supabase/server.ts` — server client for Route Handlers / Server Components using createServerClient with cookies
- `lib/supabase/middleware.ts` — auth middleware helper for session refresh

### Step 5: TanStack Query Provider
- `components/providers/query-provider.tsx` — wraps app with QueryClientProvider ("use client")

### Step 6: Full Project Structure
```
app/
├── layout.tsx              (root layout with sidebar + providers)
├── page.tsx                (redirect to /dashboard)
├── dashboard/
│   └── page.tsx            (Research Dashboard placeholder)
├── settings/
│   └── page.tsx            (BYOK settings page placeholder)
├── editor/
│   └── page.tsx            (Video asset editor placeholder)
components/
├── layout/
│   ├── sidebar.tsx         (navigation sidebar with lucide icons)
│   └── header.tsx          (top bar with user info)
├── providers/
│   └── query-provider.tsx
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── youtube.ts              (YouTube Data API service - stub)
└── gemini.ts               (Gemini AI service - stub)
hooks/
└── use-youtube.ts          (React Query hooks - stub)
middleware.ts               (Next.js middleware for Supabase auth)
supabase/
└── migrations/
    └── 001_user_api_keys.sql
```

### Step 7: Layout & Sidebar
- Sidebar with nav links: Dashboard, Editor, Settings
- Uses lucide-react icons (LayoutDashboard, Video, Settings)
- Responsive: collapsible on mobile
- shadcn/ui Button and Separator components

### Step 8: Placeholder Pages
- `/dashboard` — "Research Dashboard" heading + description
- `/settings` — "Settings" heading + placeholder for BYOK API key input
- `/editor` — "Video Asset Editor" heading + placeholder for tools

### Verification Checklist
1. `npm run dev` — app starts without errors
2. Navigate to `localhost:3000` — redirects to /dashboard
3. Sidebar links navigate between Dashboard, Editor, Settings
4. `npm run build` — no TypeScript or lint errors
