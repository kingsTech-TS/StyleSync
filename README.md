# StyleSync — Web App

The web frontend for **StyleSync**: photograph the clothes you own, get outfits built only from your
wardrobe, and see every look on a doll that resembles you.

This repo is the **Next.js** client. The API lives in the sibling FastAPI project, [`../StyleSync-BD`](../StyleSync-BD).
The full build plan is in [`implement.md`](implement.md).

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Environment variables](#environment-variables)
5. [Scripts](#scripts)
6. [Routes](#routes)
7. [Project structure](#project-structure)
8. [How it talks to the backend](#how-it-talks-to-the-backend)
9. [Design system](#design-system)
10. [Troubleshooting](#troubleshooting)

---

## Features

| Area              | What you can do                                                                       |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Account**       | Register, log in with email or username, reset password, verify email                 |
| **Doll**          | Make a doll from a selfie, then change hair, skin and eye color or hair style         |
| **Wardrobe**      | Create collections, add items from a photo (name and color filled in), edit and move  |
| **Style me**      | Pick an occasion, weather and time of day; get an outfit built from what you own      |
| **Creation Room** | Drag or tap clothes onto your doll, preview live, change hair color, save the outfit  |
| **Stylist chat**  | Ask for tips or send a photo to recreate a look from your own wardrobe (streamed)     |
| **Feed**          | Publish outfits, like, save, comment, follow, block and report                        |
| **Admin**         | Users, system health, stats, published outfits, reports, themes, AI budget and quotas |

---

## Tech stack

| Layer        | Choice                                                           |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19                                |
| Language     | TypeScript 5.9                                                   |
| Styling      | Tailwind CSS 4, design tokens in `src/app/globals.css`           |
| Runtime      | Bun 1.4                                                          |
| Server state | TanStack Query 5                                                 |
| Forms        | React Hook Form + Zod                                            |
| UI parts     | Radix UI primitives, Lucide icons, Sonner toasts, dnd-kit        |
| API types    | Generated from the backend's OpenAPI schema (openapi-typescript) |
| Doll SVGs    | Sanitized with DOMPurify, then rendered inline                   |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.4 or newer
- The backend running locally (Python 3.12+, MongoDB). See [`../StyleSync-BD/README.md`](../StyleSync-BD/README.md)

### 1. Start the backend

```bash
cd ../StyleSync-BD
.venv/Scripts/activate                 # macOS/Linux: source .venv/bin/activate
uvicorn app.main:app --reload          # http://localhost:8000
```

### 2. Start the web app

```bash
cd ../StyleSync
cp .env.example .env.local             # set BACKEND_URL if the API isn't on :8000
bun install
bun dev                                # http://localhost:3000
```

Open <http://localhost:3000>, create an account, and you'll land on the doll setup.

> **Tip:** to make yourself an admin, run this in the backend folder:
> `python -m app.cli create-admin --email you@example.com --username admin --name "Admin" --sex female`

---

## Environment variables

| Variable      | Default                 | Used for                                                    |
| ------------- | ----------------------- | ----------------------------------------------------------- |
| `BACKEND_URL` | `http://localhost:8000` | Where the rewrite proxy in `next.config.ts` sends API calls |

The backend's `.env` must have `FRONTEND_ORIGIN=http://localhost:3000` so links in emails
(password reset, email verification) point back to this app.

---

## Scripts

| Command             | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `bun dev`           | Start the dev server on port 3000                                            |
| `bun run build`     | Production build                                                             |
| `bun run start`     | Serve the production build                                                   |
| `bun run typecheck` | Type-check the whole project                                                 |
| `bun run gen:api`   | Regenerate `src/lib/api/schema.d.ts` from the running backend's OpenAPI JSON |

Run `bun run gen:api` whenever a backend request or response model changes.

---

## Routes

| Route                       | Access    | Screen                                                 |
| --------------------------- | --------- | ------------------------------------------------------ |
| `/`                         | Public    | Landing page                                           |
| `/login`, `/register`       | Public    | Sign in, create an account                             |
| `/forgot-password`          | Public    | Request a reset link                                   |
| `/reset-password?token=`    | Public    | Choose a new password                                  |
| `/verify-email?token=`      | Public    | Confirm an email address                               |
| `/feed`                     | Signed in | For you / Following feed                               |
| `/wardrobe`                 | Signed in | Collections                                            |
| `/wardrobe/[collectionId]`  | Signed in | Items in one collection, add item                      |
| `/creation-room`            | Signed in | Style the doll by hand (`?outfit=` to remix an outfit) |
| `/generate`                 | Signed in | Style me: AI outfit by occasion and weather            |
| `/chat`, `/chat/[id]`       | Signed in | Stylist chat                                           |
| `/outfits`, `/outfits/[id]` | Signed in | My outfits, outfit detail                              |
| `/saved`                    | Signed in | Outfits saved from the feed                            |
| `/avatar`                   | Signed in | Edit the doll                                          |
| `/profile`                  | Signed in | Account, password, settings, AI usage                  |
| `/u/[username]`             | Signed in | Public profile                                         |
| `/admin/*`                  | Admin     | Overview, users, published, reports, themes, AI budget |

---

## Project structure

```text
src/
├── app/
│   ├── (auth)/          login, register, forgot and reset password
│   ├── (app)/           signed-in screens (feed, wardrobe, creation room, chat, ...)
│   ├── (admin)/admin/   admin dashboard
│   ├── verify-email/    email confirmation link
│   ├── globals.css      design tokens, doll stage styles, animations
│   ├── layout.tsx       fonts, theme script, providers
│   └── page.tsx         landing page
├── components/
│   ├── ui/              buttons, inputs, password field, dialogs, menus, tabs
│   ├── layout/          app shell, sidebar, mobile nav, auth guards, wordmark
│   ├── doll/            DollStage, Doll, OutfitRender (every doll goes through these)
│   ├── marketing/       landing page illustrations
│   ├── wardrobe/        collections, add-item flow, item drawer, GarmentImage
│   ├── creation-room/   item tiles, worn list, hair swatches, save dialog
│   ├── generate/        occasion and weather selectors, outfit result
│   ├── outfit/          outfit cards, grids, like and save actions
│   ├── social/          comments, follow button, report dialog
│   ├── chat/            session list, thread, composer, streaming
│   ├── avatar/          doll editor panels and palettes
│   ├── profile/         profile sections
│   └── admin/           charts, admin nav, theme dialog
├── hooks/               geolocation
└── lib/
    ├── api/             fetch client, errors, SSE parser, generated + hand-written types
    ├── auth/            in-memory token store, auth context
    ├── queries/         TanStack Query hooks and shared query keys
    ├── validation/      Zod schemas that mirror the backend's rules
    ├── slots.ts         Creation Room slot rules
    ├── svg.ts           doll SVG sanitizing
    └── theme.ts         light/dark theme script
```

---

## How it talks to the backend

| Concern            | How it works                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Proxy**          | `/api/v1/*` and `/media/*` are rewritten to `BACKEND_URL`, so cookies are first-party and no CORS is needed  |
| **Access token**   | Kept in memory only, sent as `Authorization: Bearer …`                                                       |
| **Refresh token**  | httpOnly cookie. Refreshed once at a time on a `401`, and every 13 minutes while signed in                   |
| **Route guards**   | Client-side (`RequireAuth`), because the token isn't visible to server middleware                            |
| **Doll renders**   | Run in the background. Pages poll the outfit until `render.status` is `done`                                 |
| **Chat**           | `POST` with `multipart/form-data`, streamed back as Server-Sent Events and parsed in `lib/api/sse.ts`        |
| **Garment images** | `GarmentImage` shows the photo first and swaps in the background-removed cutout when Cloudinary has it ready |

---

## Design system

| Token / style | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Background    | Blush `#fbf1f0`, white rounded frames                                   |
| Accent        | Coral `#f0625d`                                                         |
| Headlines     | Anton, uppercase (`font-display`)                                       |
| Body text     | Plus Jakarta Sans                                                       |
| Shapes        | Pill buttons, large radii (`--radius-card: 1.5rem`)                     |
| Doll stage    | `.doll-stage`, platform and contact shadow, idle sway (`.doll-live`)    |
| Dark mode     | Follows the system; users can force light or dark from the account menu |

All colors are CSS variables in `src/app/globals.css`. Use the Tailwind names (`bg-surface`,
`text-muted`, `bg-accent`, …) instead of raw hex values so dark mode keeps working.

---

## Troubleshooting

| Problem                                       | Fix                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Stuck on the StyleSync splash screen          | The backend isn't reachable. Check it's running and that `BACKEND_URL` is right |
| `Port 3000 is in use` on `bun dev`            | Another dev server is already running. Use it, or stop it first                 |
| Types out of date after a backend change      | Run `bun run gen:api` with the backend running                                  |
| Reset or verify emails link to the wrong host | Set `FRONTEND_ORIGIN` in the backend's `.env`                                   |
| AI features say the stylist is "resting"      | The free AI credit or a daily quota is used up. Manual features keep working    |
